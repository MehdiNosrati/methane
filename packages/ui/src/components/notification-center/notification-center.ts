import { UIElement, type NotificationItem, type PropertyValues } from '@methane/core';
import {
  NotificationStoreController,
  OverlayController,
  type NotifyOptions,
  type OverlayCloseReason,
} from '@methane/primitives';
import { html, nothing } from 'lit';
import { property, query } from 'lit/decorators.js';
import { notificationCenterMessages } from './notification-center.messages.js';
import { notificationCenterStyles } from './notification-center.styles.js';

/**
 * `<mth-notification-center>`: runtime-scoped notification inbox reading
 * `getRuntime().notifications` via `NotificationStoreController` and `OverlayController`.
 */
export class MthNotificationCenter extends UIElement {
  static override messages = notificationCenterMessages;
  static override styles = notificationCenterStyles;

  @property({ type: Boolean, reflect: true })
  open = false;

  @property({ type: Boolean, reflect: true })
  inline = false;

  @property({ type: String })
  heading = '';

  @property({ type: Number, attribute: 'max-items' })
  maxItems = 20;

  @query('.panel')
  private panelEl!: HTMLElement | null;

  private readonly storeCtrl: NotificationStoreController;
  private readonly overlayCtrl: OverlayController;
  private triggerEl: HTMLElement | null = null;
  private syncingFromController = false;

  constructor() {
    super();

    this.storeCtrl = new NotificationStoreController(this);

    this.overlayCtrl = new OverlayController(this, {
      mode: 'non-modal',
      surface: () => this.panelEl,
      trigger: () => this.triggerEl,
      closeOnEscape: true,
      lightDismiss: false,
      restoreFocus: true,
      onSetCustomState: (name, active) => {
        this.setCustomState(name, active);
      },
      onOpenChange: (nextOpen) => {
        this.syncingFromController = true;
        this.open = nextOpen;
        this.syncingFromController = false;
        this.setCustomState('open', nextOpen);
      },
    });
  }

  public get notifications(): ReadonlyArray<NotificationItem> {
    return this.storeCtrl.items;
  }

  public notify(options: NotifyOptions): NotificationItem {
    return this.storeCtrl.notify(options);
  }

  public dismiss(id: string): boolean {
    const removed = this.storeCtrl.dismiss(id);
    if (removed) {
      this.emitEvent('mth-dismiss', { detail: { id } });
    }
    return removed;
  }

  public clearAll(): void {
    this.storeCtrl.clear();
    this.emitEvent('mth-clear');
  }

  public show(trigger?: HTMLElement | null): Promise<boolean> {
    if (trigger !== undefined) {
      this.triggerEl = trigger;
    }
    return this.overlayCtrl.show();
  }

  public hide(reason: OverlayCloseReason = 'programmatic'): Promise<boolean> {
    return this.overlayCtrl.hide(reason);
  }

  protected override willUpdate(changedProperties: PropertyValues): void {
    super.willUpdate(changedProperties);
    this.setCustomState('empty', this.storeCtrl.items.length === 0);
  }

  protected override updated(changedProperties: PropertyValues): void {
    super.updated(changedProperties);
    if (changedProperties.has('open') && !this.syncingFromController) {
      if (this.open && !this.overlayCtrl.open) {
        void this.overlayCtrl.show();
      } else if (!this.open && this.overlayCtrl.open) {
        void this.overlayCtrl.hide('programmatic');
      }
    }
  }

  protected override render() {
    const headingId = 'mth-notification-center-heading';
    const visibleItems = this.storeCtrl.items.slice(0, Math.max(1, this.maxItems));
    const isVisible = this.inline || this.open;
    const titleText = this.heading || this.t('heading');

    return html`
      <section
        class="panel"
        part="base"
        role="region"
        aria-labelledby=${headingId}
        ?hidden=${!isVisible}
      >
        <header class="header" part="header">
          <div class="title-wrap">
            <h2 id=${headingId} class="heading" part="heading">${titleText}</h2>
            <span class="badge" part="badge" aria-label=${this.t('unreadLabel', { count: this.storeCtrl.items.length })}>
              ${this.storeCtrl.items.length}
            </span>
          </div>
          <div class="header-actions">
            <slot name="actions"></slot>
            ${this.storeCtrl.items.length > 0
              ? html`
                  <button
                    type="button"
                    class="action-btn"
                    part="clear-button"
                    @click=${() => this.clearAll()}
                  >
                    ${this.t('clearAllLabel')}
                  </button>
                `
              : nothing}
            ${!this.inline
              ? html`
                  <button
                    type="button"
                    class="action-btn"
                    part="close-button"
                    aria-label=${this.t('closeLabel')}
                    @click=${() => void this.hide('invoker')}
                  >
                    ✕
                  </button>
                `
              : nothing}
          </div>
        </header>

        ${visibleItems.length === 0
          ? html`
              <div class="empty" part="empty">
                <slot name="empty">${this.t('emptyMessage')}</slot>
              </div>
            `
          : html`
              <ul class="list" part="list">
                ${visibleItems.map(
                  (item) => html`
                    <li
                      class="item"
                      part="item"
                      data-tone=${item.tone ?? 'info'}
                      @mouseenter=${() => this.storeCtrl.pause(item.id)}
                      @mouseleave=${() => this.storeCtrl.resume(item.id)}
                    >
                      <div class="item-body">
                        ${item.title ? html`<p class="item-title">${item.title}</p>` : nothing}
                        <p class="item-msg">${item.message}</p>
                      </div>
                      <button
                        type="button"
                        class="action-btn"
                        part="dismiss-button"
                        aria-label=${this.t('dismissLabel')}
                        @click=${() => this.dismiss(item.id)}
                      >
                        ✕
                      </button>
                    </li>
                  `,
                )}
              </ul>
            `}
      </section>
    `;
  }
}
