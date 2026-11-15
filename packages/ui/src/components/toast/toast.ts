import { getRuntime, UIElement, type NotificationItem, type PropertyValues } from '@methane-ui/core';
import {
  LiveAnnouncer,
  NotificationStoreController,
  OverlayController,
  type MotionControllerOptions,
  type MotionPhase,
  type NotifyOptions,
  type OverlayCloseReason,
} from '@methane-ui/primitives';
import { html, nothing } from 'lit';
import { property, query, state } from 'lit/decorators.js';
import { toastMessages } from './toast.messages.js';
import { toastStyles } from './toast.styles.js';

export type MthToastVariant = 'info' | 'success' | 'warning' | 'danger';
export type MthToastPlacement =
  | 'top-start'
  | 'top-center'
  | 'top-end'
  | 'bottom-start'
  | 'bottom-center'
  | 'bottom-end';

export interface MthToastNotifyOptions extends Omit<NotifyOptions, 'tone' | 'durationMs'> {
  readonly variant?: MthToastVariant;
  readonly duration?: number;
}

const TOAST_CONTROLLER_SYMBOL = Symbol.for('@methane-ui/ui/toast-controller');

function getSharedStoreController(): NotificationStoreController {
  const runtime = getRuntime() as unknown as Record<symbol, NotificationStoreController | undefined>;
  let controller = runtime[TOAST_CONTROLLER_SYMBOL];
  if (!controller) {
    controller = new NotificationStoreController(null);
    runtime[TOAST_CONTROLLER_SYMBOL] = controller;
  }
  return controller;
}

/**
 * `<mth-toast>`: accessible toast notification surface & `NotificationStore` viewport
 * featuring `OverlayController`, `MotionController`, `LiveAnnouncer`, pause-on-hover/focus,
 * and static `MthToast.notify(...)` helper backed by the shared Methane runtime store.
 */
export class MthToast extends UIElement {
  static override messages = toastMessages;
  static override styles = toastStyles;

  /**
   * Enqueues a notification into `getRuntime().notifications` with optional deduplication
   * and auto-dismiss duration, announcing immediately via `LiveAnnouncer`.
   */
  static notify(options: MthToastNotifyOptions | string): NotificationItem {
    const normalized: MthToastNotifyOptions =
      typeof options === 'string' ? { message: options } : options;
    const tone = normalized.variant ?? 'info';
    const durationMs = normalized.duration ?? 5000;

    const item = getSharedStoreController().notify({
      ...(normalized.id ? { id: normalized.id } : {}),
      ...(normalized.dedupeKey ? { dedupeKey: normalized.dedupeKey } : {}),
      ...(normalized.title !== undefined ? { title: normalized.title } : {}),
      message: normalized.message,
      tone,
      ...(durationMs > 0 ? { durationMs } : {}),
    });

    const announcement = item.title ? `${item.title}: ${item.message}` : item.message;
    LiveAnnouncer.announce(announcement, tone === 'danger' ? 'assertive' : 'polite');
    return item;
  }

  static dismiss(id: string): void {
    getSharedStoreController().dismiss(id);
  }

  static clear(): void {
    getSharedStoreController().clear();
  }

  @property({ type: Boolean, reflect: true })
  open = false;

  @property({ type: String, reflect: true })
  variant: MthToastVariant = 'info';

  @property({ type: Number })
  duration = 5000;

  @property({ type: Boolean, reflect: true })
  closable = true;

  @property({ type: String, reflect: true })
  placement: MthToastPlacement = 'bottom-end';

  @property({ type: String })
  heading = '';

  @property({ type: String })
  message = '';

  @property({ type: Boolean, attribute: 'force-fallback', reflect: true })
  forceFallback = false;

  @state()
  private _motionPhase: MotionPhase = 'closed';

  @query('#mth-toast-surface')
  private surfaceEl!: HTMLElement | null;

  private syncingFromController = false;
  private dismissTimer: ReturnType<typeof setTimeout> | null = null;
  private remainingMs = 0;
  private timerStartedAt = 0;
  private paused = false;

  private readonly storeCtrl: NotificationStoreController;
  private readonly overlayCtrl: OverlayController;

  constructor() {
    super();

    this.storeCtrl = new NotificationStoreController(this);

    const motionOptions: MotionControllerOptions = {
      target: () => this.surfaceEl,
      enterKeyframes: [
        { opacity: 0, transform: 'translateY(0.5rem)' },
        { opacity: 1, transform: 'translateY(0)' },
      ],
      exitKeyframes: [
        { opacity: 1, transform: 'translateY(0)' },
        { opacity: 0, transform: 'translateY(0.5rem)' },
      ],
      durationMs: 160,
      respectReducedMotion: true,
      onPhaseChange: (phase) => {
        this._motionPhase = phase;
      },
    };

    this.overlayCtrl = new OverlayController(this, {
      mode: 'popover',
      surface: () => this.surfaceEl,
      closeOnEscape: true,
      lightDismiss: false,
      restoreFocus: false,
      forceFallback: false,
      motion: motionOptions,
      onSetCustomState: (name, active) => {
        this.setCustomState(name, active);
      },
      onOpenChange: (nextOpen) => {
        this.syncingFromController = true;
        this.open = nextOpen;
        this.syncingFromController = false;
        this.setCustomState('open', nextOpen);

        if (nextOpen) {
          this.startAutoDismiss();
          this.announceStandalone();
        } else {
          this.clearAutoDismiss();
          this.setPausedState(false);
        }
      },
    });
  }

  get motionPhase(): MotionPhase {
    return this._motionPhase;
  }

  get notifications(): ReadonlyArray<NotificationItem> {
    return this.storeCtrl.items;
  }

  get isPaused(): boolean {
    return this.paused;
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this.clearAutoDismiss();
  }

  protected override willUpdate(changedProperties: PropertyValues): void {
    super.willUpdate(changedProperties);
    if (changedProperties.has('forceFallback') || changedProperties.has('closable')) {
      this.overlayCtrl.updateOptions({
        forceFallback: this.forceFallback,
        closeOnEscape: this.closable,
      });
    }
  }

  protected override updated(changedProperties: PropertyValues): void {
    super.updated(changedProperties);
    if (changedProperties.has('open') && !this.syncingFromController) {
      if (this.open && !this.overlayCtrl.open) {
        void this.show();
      } else if (!this.open && this.overlayCtrl.open) {
        void this.hide('programmatic');
      }
    }
  }

  async show(): Promise<boolean> {
    await this.updateComplete;
    const opened = await this.overlayCtrl.show();
    if (!opened) {
      this.syncingFromController = true;
      this.open = false;
      this.syncingFromController = false;
    }
    return opened;
  }

  async hide(reason: OverlayCloseReason = 'programmatic'): Promise<boolean> {
    this.clearAutoDismiss();
    const closed = await this.overlayCtrl.hide(reason);
    if (!closed) {
      this.syncingFromController = true;
      this.open = true;
      this.syncingFromController = false;
    }
    return closed;
  }

  pauseTimer(): void {
    if (this.paused) return;
    if (this.dismissTimer !== null) {
      clearTimeout(this.dismissTimer);
      this.dismissTimer = null;
      const elapsed = Date.now() - this.timerStartedAt;
      this.remainingMs = Math.max(0, this.remainingMs - elapsed);
    }
    this.setPausedState(true);
  }

  resumeTimer(): void {
    if (!this.paused) return;
    this.setPausedState(false);
    if (this.open && this.remainingMs > 0) {
      this.scheduleTimer(this.remainingMs);
    }
  }

  private setPausedState(active: boolean): void {
    this.paused = active;
    this.setCustomState('paused', active);
  }

  private startAutoDismiss(): void {
    this.clearAutoDismiss();
    if (this.duration <= 0) return;
    this.remainingMs = this.duration;
    if (!this.paused) {
      this.scheduleTimer(this.remainingMs);
    }
  }

  private scheduleTimer(ms: number): void {
    this.clearAutoDismiss();
    this.timerStartedAt = Date.now();
    this.remainingMs = ms;
    this.dismissTimer = setTimeout(() => {
      this.dismissTimer = null;
      this.remainingMs = 0;
      void this.hide('programmatic');
    }, ms);
  }

  private clearAutoDismiss(): void {
    if (this.dismissTimer !== null) {
      clearTimeout(this.dismissTimer);
      this.dismissTimer = null;
    }
  }

  private announceStandalone(): void {
    const bodyText = this.message || this.textContent?.trim() || '';
    const text = [this.heading, bodyText].filter((s) => s.length > 0).join(': ');
    if (text.length > 0) {
      LiveAnnouncer.announce(text, this.variant === 'danger' ? 'assertive' : 'polite');
    }
  }

  private readonly handlePauseEnter = (): void => {
    this.pauseTimer();
  };

  private readonly handlePauseLeave = (): void => {
    this.resumeTimer();
  };

  private readonly handleCloseClick = (): void => {
    void this.hide('programmatic');
  };

  private readonly handleStoreItemPause = (id: string): void => {
    getSharedStoreController().pause(id);
    this.setPausedState(true);
  };

  private readonly handleStoreItemResume = (id: string): void => {
    getSharedStoreController().resume(id);
    this.setPausedState(false);
  };

  private readonly handleStoreItemDismiss = (id: string): void => {
    getSharedStoreController().dismiss(id);
  };

  private renderStoreItem(item: NotificationItem) {
    const role = item.tone === 'danger' ? 'alert' : 'status';
    return html`
      <div
        part="item"
        class="card"
        role=${role}
        data-tone=${item.tone ?? 'info'}
        @pointerenter=${() => this.handleStoreItemPause(item.id)}
        @pointerleave=${() => this.handleStoreItemResume(item.id)}
        @focusin=${() => this.handleStoreItemPause(item.id)}
        @focusout=${() => this.handleStoreItemResume(item.id)}
      >
        <div part="content" class="content">
          ${item.title ? html`<div part="title" class="title">${item.title}</div>` : nothing}
          <div part="message" class="message">${item.message}</div>
        </div>
        ${this.closable
          ? html`
              <button
                type="button"
                part="close-button"
                class="close-btn"
                aria-label=${this.t('close')}
                @click=${() => this.handleStoreItemDismiss(item.id)}
              >
                ×
              </button>
            `
          : nothing}
      </div>
    `;
  }

  override render() {
    const standaloneRole = this.variant === 'danger' ? 'alert' : 'status';

    return html`
      <section part="region" class="region" aria-label=${this.t('regionLabel')}>
        ${this.storeCtrl.items.length > 0
          ? this.storeCtrl.items.map((item) => this.renderStoreItem(item))
          : nothing}
        <div
          id="mth-toast-surface"
          part="base"
          class="card"
          role=${standaloneRole}
          popover="manual"
          ?hidden=${!this.open}
          @pointerenter=${this.handlePauseEnter}
          @pointerleave=${this.handlePauseLeave}
          @focusin=${this.handlePauseEnter}
          @focusout=${this.handlePauseLeave}
        >
          <span part="icon" class="icon"><slot name="icon"></slot></span>
          <div part="content" class="content">
            <div part="title" class="title" ?hidden=${!this.heading}>
              <slot name="title">${this.heading}</slot>
            </div>
            <div part="message" class="message">
              <slot>${this.message}</slot>
            </div>
          </div>
          <div part="actions" class="actions">
            <slot name="action"></slot>
          </div>
          ${this.closable
            ? html`
                <button
                  type="button"
                  part="close-button"
                  class="close-btn"
                  aria-label=${this.t('close')}
                  @click=${this.handleCloseClick}
                >
                  ×
                </button>
              `
            : nothing}
        </div>
      </section>
    `;
  }
}
