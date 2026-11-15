import { UIElement, type PropertyValues } from '@methane-ui/core';
import {
  DataController,
  type DataSource,
  VirtualizerController,
} from '@methane-ui/primitives';
import '@methane-ui/ui/avatar';
import '@methane-ui/ui/badge';
import { html, nothing } from 'lit';
import { property, query } from 'lit/decorators.js';
import { resolveEffectiveDir } from '../../shared/dir.js';
import { renderSafeMarkdown } from '../../shared/safe-markdown.js';
import { chatThreadMessages } from './chat-thread.messages.js';
import { chatThreadStyles } from './chat-thread.styles.js';

export interface ChatMessage {
  readonly id: string;
  readonly author: string;
  readonly avatarSrc?: string;
  readonly body: string;
  readonly timestamp?: string;
  readonly self?: boolean;
  readonly badge?: string;
}

function getDateKey(iso: string | undefined): string {
  if (!iso) return '';
  const idx = iso.indexOf('T');
  if (idx >= 10) return iso.slice(0, 10);
  if (/^\d{4}-\d{2}-\d{2}$/.test(iso)) return iso;
  return '';
}

function formatDateLabel(dateKey: string, locale: string): string {
  if (!dateKey) return '';
  const parsed = new Date(`${dateKey}T00:00:00.000Z`);
  if (Number.isNaN(parsed.getTime())) return dateKey;
  return new Intl.DateTimeFormat(locale, {
    dateStyle: 'medium',
    timeZone: 'UTC',
  }).format(parsed);
}

/**
 * `<mth-chat-thread>`: virtualized message stream powered by `VirtualizerController` and
 * `DataController`, composing `<mth-avatar>` / `<mth-badge>`, date & unread dividers,
 * `@methane-ui/sanitize` markdown bodies, and a scroll-to-bottom anchor.
 */
export class MthChatThread extends UIElement {
  static override messages = chatThreadMessages;
  static override styles = chatThreadStyles;

  @property({ attribute: false })
  messages: ReadonlyArray<ChatMessage> = [];

  @property({ attribute: false })
  dataSource: DataSource<ChatMessage> | null = null;

  @property({ type: Number, attribute: 'estimate-height' })
  estimateHeight = 72;

  @property({ type: Number })
  overscan = 4;

  @property({ type: String, attribute: 'unread-message-id' })
  unreadMessageId = '';

  @property({ type: String })
  label = '';

  @property({ type: Boolean, attribute: 'show-scroll-to-bottom' })
  showScrollToBottom = true;

  @property({ type: Boolean, attribute: 'allow-raw-html' })
  allowRawHtml = false;

  @query('.scroller')
  private scrollerEl!: HTMLElement;

  private padSheet: CSSStyleSheet | null = null;
  private appliedOverscan = 4;
  private virtualizerCtrl: VirtualizerController;
  private readonly dataCtrl: DataController<ChatMessage>;

  constructor() {
    super();

    this.dataCtrl = new DataController<ChatMessage>(this, {
      autoLoad: false,
      onStateChange: () => {
        this.syncCount();
        this.syncStates();
      },
    });

    this.virtualizerCtrl = this.createVirtualizer(this.overscan);
  }

  private createVirtualizer(overscan: number): VirtualizerController {
    const safeOverscan = Number.isFinite(overscan) ? Math.max(0, Math.floor(overscan)) : 4;
    this.appliedOverscan = safeOverscan;
    return new VirtualizerController(this, {
      count: this.activeMessages.length,
      estimateSize: () => Math.max(24, this.estimateHeight || 72),
      overscan: safeOverscan,
      getScrollElement: () => this.scrollerEl,
    });
  }

  get activeMessages(): ReadonlyArray<ChatMessage> {
    if (this.dataSource) {
      return this.dataCtrl.items;
    }
    return this.messages ?? [];
  }

  scrollToBottom(): void {
    const scroller = this.scrollerEl;
    if (scroller) {
      scroller.scrollTop = scroller.scrollHeight;
    }
    this.emitEvent('mth-scroll-bottom');
  }

  override connectedCallback(): void {
    super.connectedCallback();
    this.syncCount();
    this.syncStates();
    if (this.hasUpdated) {
      this.syncPaddingSheet();
    }
  }

  protected override onMoveBefore(): void {
    super.onMoveBefore();
    if (this.hasUpdated) {
      this.syncPaddingSheet();
    }
  }

  override willUpdate(changed: PropertyValues<this>): void {
    super.willUpdate(changed);
    if (changed.has('overscan')) {
      const nextOverscan = Number.isFinite(this.overscan) ? Math.max(0, Math.floor(this.overscan)) : 4;
      if (nextOverscan !== this.appliedOverscan) {
        this.virtualizerCtrl.hostDisconnected();
        this.removeController(this.virtualizerCtrl);
        this.virtualizerCtrl = this.createVirtualizer(nextOverscan);
        if (this.isConnected) {
          this.virtualizerCtrl.hostConnected();
        }
      }
    }
    if (changed.has('dataSource')) {
      this.dataCtrl.setDataSource(this.dataSource ?? null, { load: Boolean(this.dataSource) });
    }
    if (changed.has('messages') || changed.has('dataSource')) {
      this.syncCount();
      this.syncStates();
    }
  }

  protected override updated(changed: PropertyValues<this>): void {
    super.updated(changed);
    this.syncPaddingSheet();
  }

  private syncCount(): void {
    this.virtualizerCtrl.setCount(this.activeMessages.length);
  }

  private syncStates(): void {
    const loading = Boolean(this.dataSource) && this.dataCtrl.status === 'loading';
    const hasError = Boolean(this.dataSource) && this.dataCtrl.status === 'error';
    const empty = !loading && !hasError && this.activeMessages.length === 0;
    this.setCustomState('loading', loading);
    this.setCustomState('error', hasError);
    this.setCustomState('empty', empty);
  }

  private syncPaddingSheet(): void {
    const root = this.shadowRoot;
    if (!root || !('adoptedStyleSheets' in root) || typeof CSSStyleSheet === 'undefined') {
      return;
    }
    const vItems = this.virtualizerCtrl.getVirtualItems();
    const first = vItems[0];
    const last = vItems[vItems.length - 1];
    const total = this.virtualizerCtrl.totalSize;
    const padTop = first ? Math.max(0, Math.round(first.start)) : 0;
    const padBottom = last ? Math.max(0, Math.round(total - last.end)) : 0;

    if (!this.padSheet) {
      this.padSheet = new CSSStyleSheet();
    }
    if (typeof this.padSheet.replaceSync === 'function') {
      this.padSheet.replaceSync(`:host { --_ct-pad-top: ${padTop}px; --_ct-pad-bottom: ${padBottom}px; }`);
      if (!root.adoptedStyleSheets.includes(this.padSheet)) {
        root.adoptedStyleSheets = [...root.adoptedStyleSheets, this.padSheet];
      }
    }
  }

  protected override render() {
    const list = this.activeMessages;
    const isLoading = Boolean(this.dataSource) && this.dataCtrl.status === 'loading';
    const isError = Boolean(this.dataSource) && this.dataCtrl.status === 'error';
    const vItems = this.virtualizerCtrl.getVirtualItems();
    const visibleEntries = vItems
      .map((vi) => ({ vi, msg: list[vi.index] }))
      .filter((entry): entry is { vi: (typeof vItems)[number]; msg: ChatMessage } =>
        Boolean(entry.msg),
      );
    const locale = this.resolvedLocale;

    return html`
      <section class="base" part="base" dir=${resolveEffectiveDir(this, this.resolvedDir)} aria-label=${this.label || this.t('threadLabel')}>
        ${isLoading
          ? html`<div class="state-box" role="status">${this.t('loadingLabel')}</div>`
          : isError
            ? html`
                <div class="state-box" role="alert">
                  <span>${this.t('errorLabel')}</span>
                  <button
                    type="button"
                    class="retry-btn"
                    @click=${() => {
                      void this.dataCtrl.refresh();
                      this.emitEvent('mth-retry');
                    }}
                  >
                    ${this.t('retryLabel')}
                  </button>
                </div>
              `
            : list.length === 0
              ? html`<div class="state-box">${this.t('emptyLabel')}</div>`
              : html`
                  <div class="scroller" part="scroller" role="log" aria-live="off">
                    <div class="stream" part="stream">
                      ${visibleEntries.map(({ vi, msg }, idx) => {
                        const prevMsg = vi.index > 0 ? list[vi.index - 1] : undefined;
                        const prevDate = getDateKey(prevMsg?.timestamp);
                        const currDate = getDateKey(msg.timestamp);
                        const showDateDivider = currDate.length > 0 && (idx === 0 || currDate !== prevDate);
                        const showUnread =
                          Boolean(this.unreadMessageId) && msg.id === this.unreadMessageId;

                        return html`
                          ${showDateDivider
                            ? html`
                                <div class="date-separator" part="date-separator" role="separator">
                                  ${formatDateLabel(currDate, locale)}
                                </div>
                              `
                            : nothing}
                          ${showUnread
                            ? html`
                                <div class="unread-divider" part="unread-divider" role="separator">
                                  ${this.t('unreadDividerLabel')}
                                </div>
                              `
                            : nothing}
                          <article
                            class="message"
                            part="message"
                            data-self=${msg.self ? 'true' : 'false'}
                            data-message-id=${msg.id}
                          >
                            <mth-avatar
                              name=${msg.author}
                              src=${msg.avatarSrc ?? ''}
                              size="sm"
                            ></mth-avatar>
                            <div class="bubble">
                              <div class="header">
                                <span class="author" part="message-author">${msg.author}</span>
                                ${msg.badge
                                  ? html`<mth-badge size="sm" variant="neutral">${msg.badge}</mth-badge>`
                                  : nothing}
                                ${msg.timestamp
                                  ? html`<span class="timestamp">${msg.timestamp}</span>`
                                  : nothing}
                              </div>
                              <div class="body" part="message-body">
                                ${renderSafeMarkdown(msg.body, {
                                  allowRawHtml: this.allowRawHtml,
                                })}
                              </div>
                            </div>
                          </article>
                        `;
                      })}
                    </div>
                  </div>
                `}

        ${this.showScrollToBottom && list.length > 0
          ? html`
              <div class="scroll-bottom-wrap">
                <button
                  type="button"
                  class="scroll-bottom"
                  part="scroll-bottom"
                  @click=${() => this.scrollToBottom()}
                >
                  ${this.t('scrollToBottomLabel')}
                </button>
              </div>
            `
          : nothing}
      </section>
    `;
  }
}
