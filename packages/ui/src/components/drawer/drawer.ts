import { UIElement, type PropertyValues } from '@methane-ui/core';
import {
  FocusTrapController,
  OverlayController,
  type MotionControllerOptions,
  type MotionPhase,
  type OverlayCloseReason,
} from '@methane-ui/primitives';
import { html, nothing } from 'lit';
import { property, query, state } from 'lit/decorators.js';
import { drawerMessages } from './drawer.messages.js';
import { drawerStyles } from './drawer.styles.js';

export type MthDrawerPlacement = 'end' | 'start' | 'top' | 'bottom';
export type MthDrawerSize = 'sm' | 'md' | 'lg' | 'full';

/**
 * `<mth-drawer>`: top-layer sliding sheet overlay wrapping native `<dialog>` with
 * logical edge placement (`end | start | top | bottom`), size presets, focus trapping,
 * backdrop/Escape dismissal, and enter/exit transitions (`MotionController`).
 */
export class MthDrawer extends UIElement {
  static override messages = drawerMessages;
  static override styles = drawerStyles;

  @property({ type: Boolean, reflect: true })
  open = false;

  @property({ type: String, reflect: true })
  placement: MthDrawerPlacement = 'end';

  @property({ type: String, reflect: true })
  size: MthDrawerSize = 'md';

  @property({ type: String })
  label = '';

  @property({ type: Boolean, reflect: true })
  dismissible = true;

  @property({ type: Boolean, reflect: true })
  modal = true;

  @property({ type: Boolean, attribute: 'force-fallback', reflect: true })
  forceFallback = false;

  @state()
  private hasSlottedHeader = false;

  @state()
  private hasSlottedFooter = false;

  @state()
  private _motionPhase: MotionPhase = 'closed';

  @query('#mth-drawer-surface')
  private dialogEl!: HTMLDialogElement | null;

  @query('.popup')
  private popupEl!: HTMLElement | null;

  private syncingFromController = false;
  private cancelDispatchedForCurrentClose = false;

  private readonly overlayCtrl: OverlayController;
  private readonly focusTrapCtrl: FocusTrapController;

  constructor() {
    super();

    const motionOptions: MotionControllerOptions = {
      target: () => this.popupEl ?? this.dialogEl,
      enterKeyframes: this.getEnterKeyframes(),
      exitKeyframes: this.getExitKeyframes(),
      durationMs: 180,
      respectReducedMotion: true,
      onPhaseChange: (phase) => {
        this._motionPhase = phase;
      },
    };

    this.overlayCtrl = new OverlayController(this, {
      mode: 'dialog',
      surface: () => this.dialogEl,
      closeOnEscape: true,
      lightDismiss: false,
      restoreFocus: true,
      forceFallback: false,
      motion: motionOptions,
      onSetCustomState: (name, active) => {
        this.setCustomState(name, active);
      },
      onOpenChange: (nextOpen, reason) => {
        this.syncingFromController = true;
        this.open = nextOpen;
        this.syncingFromController = false;

        if (nextOpen) {
          this.cancelDispatchedForCurrentClose = false;
          this.setCustomState('open', true);
          if (this.modal) {
            this.focusTrapCtrl.activate();
          }
        } else {
          this.focusTrapCtrl.deactivate();
          this.setCustomState('open', false);
          if (reason === 'escape' && !this.cancelDispatchedForCurrentClose) {
            this.cancelDispatchedForCurrentClose = true;
            this.emitEvent('mth-cancel', {
              detail: { reason: 'escape' },
              cancelable: true,
            });
          }
        }
      },
    });

    this.focusTrapCtrl = new FocusTrapController(this, {
      container: () => this.dialogEl,
      restoreFocus: false,
    });
  }

  get motionPhase(): MotionPhase {
    return this._motionPhase;
  }

  get isUsingNativeTopLayer(): boolean {
    return this.overlayCtrl.isUsingNativeTopLayer;
  }

  override connectedCallback(): void {
    super.connectedCallback();
    this.syncHostRole();
  }

  protected override willUpdate(changedProperties: PropertyValues): void {
    super.willUpdate(changedProperties);
    if (
      changedProperties.has('modal') ||
      changedProperties.has('dismissible') ||
      changedProperties.has('forceFallback') ||
      changedProperties.has('placement')
    ) {
      this.overlayCtrl.updateOptions({
        mode: this.modal ? 'dialog' : 'non-modal',
        closeOnEscape: this.dismissible,
        lightDismiss: false,
        forceFallback: this.forceFallback,
        motion: {
          enterKeyframes: this.getEnterKeyframes(),
          exitKeyframes: this.getExitKeyframes(),
        },
      });
      this.setCustomState('modal', this.modal);
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
    this.syncMotionKeyframes();
    const opened = await this.overlayCtrl.show();
    if (!opened) {
      this.syncingFromController = true;
      this.open = false;
      this.syncingFromController = false;
    }
    return opened;
  }

  async hide(reason: OverlayCloseReason = 'programmatic'): Promise<boolean> {
    this.syncMotionKeyframes();
    const closed = await this.overlayCtrl.hide(reason);
    if (!closed) {
      this.syncingFromController = true;
      this.open = true;
      this.syncingFromController = false;
    }
    return closed;
  }

  private syncMotionKeyframes(): void {
    this.overlayCtrl.updateOptions({
      motion: {
        enterKeyframes: this.getEnterKeyframes(),
        exitKeyframes: this.getExitKeyframes(),
      },
    });
  }

  private syncHostRole(): void {
    if (this.internals && 'role' in this.internals) {
      try {
        this.internals.role = 'dialog';
      } catch {
        // Ignore engines without writable ElementInternals.role.
      }
    }
  }

  private isRtl(): boolean {
    const dirHost = typeof this.closest === 'function' ? (this.closest('[dir]') as HTMLElement | null) : null;
    if (dirHost) {
      return dirHost.getAttribute('dir')?.toLowerCase() === 'rtl';
    }
    if (typeof getComputedStyle === 'function' && this.isConnected) {
      try {
        if (getComputedStyle(this).direction === 'rtl') return true;
      } catch {
        // Ignore in SSR or non-CSS environments.
      }
    }
    return this.ownerDocument?.documentElement?.getAttribute('dir')?.toLowerCase() === 'rtl';
  }

  private getOffscreenTransform(): string {
    const rtl = this.isRtl();
    switch (this.placement) {
      case 'start':
        return rtl ? 'translateX(100%)' : 'translateX(-100%)';
      case 'top':
        return 'translateY(-100%)';
      case 'bottom':
        return 'translateY(100%)';
      case 'end':
      default:
        return rtl ? 'translateX(-100%)' : 'translateX(100%)';
    }
  }

  private getRestingTransform(): string {
    return this.placement === 'top' || this.placement === 'bottom'
      ? 'translateY(0)'
      : 'translateX(0)';
  }

  private getEnterKeyframes(): Keyframe[] {
    return [
      { transform: this.getOffscreenTransform(), opacity: 0.4 },
      { transform: this.getRestingTransform(), opacity: 1 },
    ];
  }

  private getExitKeyframes(): Keyframe[] {
    return [
      { transform: this.getRestingTransform(), opacity: 1 },
      { transform: this.getOffscreenTransform(), opacity: 0.4 },
    ];
  }

  private readonly handleHeaderSlotChange = (event: Event): void => {
    const slot = event.target as HTMLSlotElement;
    this.hasSlottedHeader = slot
      .assignedNodes({ flatten: true })
      .some((node) => node.nodeType === Node.ELEMENT_NODE || (node.textContent?.trim().length ?? 0) > 0);
  };

  private readonly handleFooterSlotChange = (event: Event): void => {
    const slot = event.target as HTMLSlotElement;
    this.hasSlottedFooter = slot
      .assignedNodes({ flatten: true })
      .some((node) => node.nodeType === Node.ELEMENT_NODE || (node.textContent?.trim().length ?? 0) > 0);
  };

  private readonly handleDialogClick = (event: MouseEvent): void => {
    if (!this.dismissible || !this.open) return;
    const path = typeof event.composedPath === 'function' ? event.composedPath() : [];
    const clickedInsidePopup =
      this.popupEl !== null &&
      (path.includes(this.popupEl) || this.popupEl.contains(event.target as Node | null));
    if (!clickedInsidePopup && event.target === this.dialogEl) {
      this.cancelDispatchedForCurrentClose = true;
      const allowed = this.emitEvent('mth-cancel', {
        detail: { reason: 'outside' },
        cancelable: true,
      });
      if (allowed) {
        void this.hide('outside');
      }
    }
  };

  private readonly handleCloseClick = (): void => {
    void this.hide('programmatic');
  };

  override render() {
    const hasTitle = this.label.length > 0 || this.hasSlottedHeader;

    return html`
      <dialog
        id="mth-drawer-surface"
        part="base"
        class="base"
        role="dialog"
        aria-modal=${this.modal ? 'true' : 'false'}
        aria-labelledby=${hasTitle ? 'mth-drawer-title' : nothing}
        @click=${this.handleDialogClick}
      >
        <div part="popup" class="popup">
          <header part="header" class="header">
            <h2 id="mth-drawer-title" part="title" class="title">
              <slot name="header" @slotchange=${this.handleHeaderSlotChange}>${this.label}</slot>
            </h2>
            ${this.dismissible
              ? html`
                  <button
                    type="button"
                    part="close-button"
                    class="close-btn"
                    aria-label=${this.t('close')}
                    @click=${this.handleCloseClick}
                  >
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 16 16"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="1.75"
                      stroke-linecap="round"
                      aria-hidden="true"
                    >
                      <path d="M4 4 12 12M12 4 4 12" />
                    </svg>
                  </button>
                `
              : nothing}
          </header>
          <div part="body" class="body">
            <slot></slot>
          </div>
          <footer part="footer" class="footer" ?hidden=${!this.hasSlottedFooter}>
            <slot name="footer" @slotchange=${this.handleFooterSlotChange}></slot>
          </footer>
        </div>
      </dialog>
    `;
  }
}
