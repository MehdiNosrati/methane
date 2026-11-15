import { UIElement, type PropertyValues } from '@methane/core';
import {
  NotificationStoreController,
  OverlayController,
  PositioningController,
  type OverlayCloseReason,
  type Placement,
  type PositioningResult,
} from '@methane/primitives';
import { registerMthBadge } from '@methane/ui/badge';
import { html, nothing } from 'lit';
import { property, query, state } from 'lit/decorators.js';
import { renderSafeMarkdown } from '../../shared/safe-markdown.js';
import { notificationBellMessages } from './notification-bell.messages.js';
import { notificationBellStyles } from './notification-bell.styles.js';

export interface NotificationBellItem {
  readonly id: string;
  readonly title?: string;
  readonly message: string;
  readonly tone?: 'info' | 'success' | 'warning' | 'danger';
  readonly timestamp?: string;
  readonly read?: boolean;
}

/**
 * `<mth-notification-bell>`: notification bell trigger with `@methane/ui` badge,
 * `NotificationStoreController`, `OverlayController`, and dual-path `PositioningController`.
 */
export class MthNotificationBell extends UIElement {
  static override shadowRootOptions = { mode: 'open' as const, delegatesFocus: true };
  static override messages = notificationBellMessages;
  static override styles = notificationBellStyles;

  @property({ type: Boolean, reflect: true })
  open = false;

  @property({ type: String, reflect: true })
  placement: Placement = 'bottom-end';

  @property({ type: Number })
  offset = 8;

  @property({ type: Boolean, attribute: 'close-on-escape', reflect: true })
  closeOnEscape = true;

  @property({ type: Boolean, attribute: 'force-fallback', reflect: true })
  forceFallback = false;

  @property({ type: Number, attribute: 'unread-count' })
  unreadCount: number | null = null;

  @property({ type: Number, attribute: 'max-count' })
  maxCount = 99;

  @property({ type: Boolean, attribute: 'use-store', reflect: true })
  useStore = true;

  @property({ type: String })
  label = '';

  @property({ attribute: false })
  items: ReadonlyArray<NotificationBellItem> = [];

  @state()
  private locallyReadIds: ReadonlySet<string> = new Set();

  @state()
  private locallyDismissedIds: ReadonlySet<string> = new Set();

  @query('#mth-notification-trigger')
  private triggerEl!: HTMLButtonElement | null;

  @query('#mth-notification-panel')
  private panelEl!: HTMLDivElement | null;

  private syncingFromController = false;
  private positionSheet: CSSStyleSheet | null = null;

  private readonly notificationStore: NotificationStoreController;
  private readonly overlayCtrl: OverlayController;
  private readonly positioningCtrl: PositioningController;

  constructor() {
    super();
    registerMthBadge();

    this.notificationStore = new NotificationStoreController(this);

    this.overlayCtrl = new OverlayController(this, {
      mode: 'popover',
      surface: () => this.panelEl,
      trigger: () => this.triggerEl ?? this,
      closeOnEscape: this.closeOnEscape,
      lightDismiss: true,
      restoreFocus: true,
      forceFallback: this.forceFallback,
      onSetCustomState: (name, active) => {
        this.setCustomState(name, active);
      },
      onOpenChange: (nextOpen) => {
        this.syncingFromController = true;
        this.open = nextOpen;
        this.syncingFromController = false;
        this.setCustomState('open', nextOpen);
        if (nextOpen) {
          this.positioningCtrl.start();
        } else {
          this.positioningCtrl.stop();
          this.clearPositionSheet();
        }
      },
    });

    this.positioningCtrl = new PositioningController(this, {
      anchor: () => this.triggerEl,
      floating: () => this.panelEl,
      placement: this.placement,
      offset: this.offset,
      flip: true,
      shift: true,
      forceFallback: this.forceFallback,
      onPosition: (result) => {
        this.applyPositionSheet(result);
      },
    });
  }

  get effectiveItems(): ReadonlyArray<NotificationBellItem> {
    const storeItems: ReadonlyArray<NotificationBellItem> = this.useStore
      ? this.notificationStore.items.map((item) => ({
          id: item.id,
          message: item.message,
          ...(item.title !== undefined ? { title: item.title } : {}),
          ...(item.tone !== undefined ? { tone: item.tone } : {}),
        }))
      : [];

    const combined = this.items.length > 0 ? [...this.items, ...storeItems] : storeItems;
    const seen = new Set<string>();
    const result: NotificationBellItem[] = [];

    for (const item of combined) {
      if (seen.has(item.id) || this.locallyDismissedIds.has(item.id)) continue;
      seen.add(item.id);
      result.push({
        ...item,
        read: Boolean(item.read) || this.locallyReadIds.has(item.id),
      });
    }
    return result;
  }

  get computedUnreadCount(): number {
    if (typeof this.unreadCount === 'number' && Number.isFinite(this.unreadCount)) {
      return Math.max(0, Math.floor(this.unreadCount));
    }
    return this.effectiveItems.filter((item) => !item.read).length;
  }

  protected override willUpdate(changedProperties: PropertyValues): void {
    super.willUpdate(changedProperties);

    if (changedProperties.has('closeOnEscape') || changedProperties.has('forceFallback')) {
      this.overlayCtrl.updateOptions({
        closeOnEscape: this.closeOnEscape,
        forceFallback: this.forceFallback,
      });
    }

    if (
      changedProperties.has('placement') ||
      changedProperties.has('offset') ||
      changedProperties.has('forceFallback')
    ) {
      this.positioningCtrl.updateOptions({
        placement: this.placement,
        offset: this.offset,
        forceFallback: this.forceFallback,
      });
    }

    this.setCustomState('unread', this.computedUnreadCount > 0);
  }

  protected override updated(changedProperties: PropertyValues): void {
    super.updated(changedProperties);
    if (changedProperties.has('open') && !this.syncingFromController) {
      const targetOpen = this.open;
      queueMicrotask(() => {
        if (!this.isConnected) return;
        if (targetOpen && !this.overlayCtrl.open) {
          void this.show();
        } else if (!targetOpen && this.overlayCtrl.open) {
          void this.hide('programmatic');
        }
      });
    }
  }

  async show(): Promise<boolean> {
    await this.updateComplete;
    const opened = await this.overlayCtrl.show();
    if (!opened) {
      this.syncingFromController = true;
      this.open = false;
      this.syncingFromController = false;
    } else {
      this.positioningCtrl.reposition();
    }
    return opened;
  }

  async hide(reason: OverlayCloseReason = 'programmatic'): Promise<boolean> {
    const closed = await this.overlayCtrl.hide(reason);
    if (!closed) {
      this.syncingFromController = true;
      this.open = true;
      this.syncingFromController = false;
    }
    return closed;
  }

  toggle(): Promise<boolean> {
    return this.open ? this.hide('programmatic') : this.show();
  }

  markRead(id: string): void {
    const next = new Set(this.locallyReadIds);
    next.add(id);
    this.locallyReadIds = next;
  }

  markAllRead(): void {
    const next = new Set(this.locallyReadIds);
    for (const item of this.effectiveItems) {
      next.add(item.id);
    }
    this.locallyReadIds = next;
    this.emitEvent('mth-mark-all-read');
  }

  dismissItem(id: string): void {
    if (this.useStore) {
      this.notificationStore.dismiss(id);
    }
    const next = new Set(this.locallyDismissedIds);
    next.add(id);
    this.locallyDismissedIds = next;
    this.emitEvent('mth-item-dismiss', { detail: { id } });
  }

  private handleTriggerClick(): void {
    void this.toggle();
  }

  private handleSelectItem(item: NotificationBellItem): void {
    this.markRead(item.id);
    this.emitEvent('mth-item-select', { detail: { id: item.id } });
  }

  private formatBadgeCount(count: number): string {
    const cap = Number.isFinite(this.maxCount) && this.maxCount > 0 ? Math.floor(this.maxCount) : 99;
    return count > cap ? `${cap}+` : String(count);
  }

  private ensurePositionSheet(): CSSStyleSheet | null {
    if (this.positionSheet) return this.positionSheet;
    if (typeof CSSStyleSheet === 'undefined' || !this.shadowRoot) return null;
    try {
      const sheet = new CSSStyleSheet();
      this.shadowRoot.adoptedStyleSheets = [...this.shadowRoot.adoptedStyleSheets, sheet];
      this.positionSheet = sheet;
      return sheet;
    } catch {
      return null;
    }
  }

  private clearPositionSheet(): void {
    try {
      this.positionSheet?.replaceSync('');
    } catch {
      // ignore in SSR / restricted environments
    }
  }

  private applyPositionSheet(result: PositioningResult): void {
    const sheet = this.ensurePositionSheet();
    if (!sheet) return;
    if (result.strategy === 'css-anchor') {
      sheet.replaceSync('');
      return;
    }
    const x = Number.isFinite(result.x) ? Math.round(result.x) : 0;
    const y = Number.isFinite(result.y) ? Math.round(result.y) : 0;
    sheet.replaceSync(
      `#mth-notification-panel { inset-block-start: ${y}px; inset-inline-start: ${x}px; }`,
    );
  }

  protected override render() {
    const items = this.effectiveItems;
    const unread = this.computedUnreadCount;
    const triggerLabel =
      this.label ||
      (unread > 0
        ? this.t('bellLabelWithCount', { count: unread })
        : this.t('bellLabel'));
    const popoverAttr = this.forceFallback ? nothing : 'manual';

    return html`
      <div class="root" part="base" dir=${this.resolvedDir}>
        <button
          id="mth-notification-trigger"
          class="trigger"
          part="trigger"
          type="button"
          aria-label=${triggerLabel}
          aria-haspopup="dialog"
          aria-expanded=${this.open ? 'true' : 'false'}
          aria-controls="mth-notification-panel"
          @click=${this.handleTriggerClick}
        >
          <slot name="icon">
            <svg class="bell-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
              <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"></path>
              <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
            </svg>
          </slot>
          ${unread > 0
            ? html`<span class="badge-wrap">
                <mth-badge part="badge" variant="danger" size="sm" pill>
                  ${this.formatBadgeCount(unread)}
                </mth-badge>
              </span>`
            : nothing}
        </button>

        <div
          id="mth-notification-panel"
          class=${this.open ? 'panel open' : 'panel'}
          part="panel"
          role="dialog"
          aria-labelledby="mth-notification-heading"
          aria-hidden=${this.open ? 'false' : 'true'}
          popover=${popoverAttr}
        >
          <div class="header" part="header">
            <h2 id="mth-notification-heading" class="heading">${this.t('heading')}</h2>
            <div class="header-actions">
              <slot name="header-actions"></slot>
              ${items.length > 0 && unread > 0
                ? html`<button class="action-btn" type="button" @click=${this.markAllRead}>
                    ${this.t('markAllRead')}
                  </button>`
                : nothing}
            </div>
          </div>

          ${items.length === 0
            ? html`<div class="empty" part="empty">${this.t('empty')}</div>`
            : html`
                <ul class="list" part="list">
                  ${items.map(
                    (item) => html`
                      <li class=${item.read ? 'item' : 'item unread'} part="item">
                        <span
                          class=${item.read ? 'dot read' : 'dot'}
                          aria-label=${item.read ? '' : this.t('unreadIndicator')}
                          aria-hidden=${item.read ? 'true' : 'false'}
                        ></span>
                        <button
                          class="item-body"
                          type="button"
                          @click=${() => this.handleSelectItem(item)}
                        >
                          ${item.title ? html`<span class="item-title">${item.title}</span>` : nothing}
                          <span class="item-message">${renderSafeMarkdown(item.message)}</span>
                          ${item.timestamp ? html`<span class="item-time">${item.timestamp}</span>` : nothing}
                        </button>
                        <button
                          class="dismiss-btn"
                          type="button"
                          aria-label=${this.t('dismiss')}
                          @click=${() => this.dismissItem(item.id)}
                        >
                          ×
                        </button>
                      </li>
                    `,
                  )}
                </ul>
              `}

          <slot name="footer"></slot>
        </div>
      </div>
    `;
  }
}
