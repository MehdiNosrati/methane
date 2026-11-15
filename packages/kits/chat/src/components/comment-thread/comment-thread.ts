import { UIElement, type PropertyValues } from '@methane/core';
import '@methane/ui/avatar';
import '@methane/ui/badge';
import { html, nothing, type TemplateResult } from 'lit';
import { property, state } from 'lit/decorators.js';
import { renderSafeMarkdown } from '../../shared/safe-markdown.js';
import { commentThreadMessages } from './comment-thread.messages.js';
import { commentThreadStyles } from './comment-thread.styles.js';

export interface CommentItem {
  readonly id: string;
  readonly author: string;
  readonly avatarSrc?: string;
  readonly body: string;
  readonly timestamp?: string;
  readonly resolved?: boolean;
  readonly replies?: ReadonlyArray<CommentItem>;
}

/**
 * `<mth-comment-thread>`: nested comment discussion thread supporting collapsible replies,
 * resolve/reopen toggling, inline replies, and `@methane/sanitize` markdown bodies.
 */
export class MthCommentThread extends UIElement {
  static override shadowRootOptions = { mode: 'open' as const, delegatesFocus: true };
  static override messages = commentThreadMessages;
  static override styles = commentThreadStyles;

  @property({ attribute: false })
  comments: ReadonlyArray<CommentItem> = [];

  @property({ type: String })
  label = '';

  @property({ type: Boolean, attribute: 'allow-reply' })
  allowReply = true;

  @property({ type: Boolean, attribute: 'allow-resolve' })
  allowResolve = true;

  @property({ type: Boolean, attribute: 'allow-raw-html' })
  allowRawHtml = false;

  @state()
  private collapsedIds: ReadonlySet<string> = new Set();

  @state()
  private activeReplyId = '';

  @state()
  private replyDraft = '';

  override connectedCallback(): void {
    super.connectedCallback();
    this.setCustomState('empty', (this.comments ?? []).length === 0);
  }

  protected override updated(changed: PropertyValues<this>): void {
    super.updated(changed);
    if (changed.has('comments')) {
      this.setCustomState('empty', (this.comments ?? []).length === 0);
    }
  }

  private toggleCollapsed(id: string): void {
    const next = new Set(this.collapsedIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    this.collapsedIds = next;
  }

  private submitReply(parentId: string): void {
    const trimmed = this.replyDraft.trim();
    if (!trimmed) return;
    this.emitEvent('mth-reply', { detail: { parentId, body: trimmed } });
    this.replyDraft = '';
    this.activeReplyId = '';
  }

  private renderCommentNode(item: CommentItem, depth: number): TemplateResult {
    const replies = item.replies ?? [];
    const hasReplies = replies.length > 0;
    const isCollapsed = this.collapsedIds.has(item.id);
    const numFmt = new Intl.NumberFormat(this.resolvedLocale);

    return html`
      <article class="comment" part="comment" data-comment-id=${item.id}>
        <div class="meta">
          <mth-avatar name=${item.author} src=${item.avatarSrc ?? ''} size="sm"></mth-avatar>
          <span class="author" part="author">${item.author}</span>
          ${item.timestamp ? html`<span class="time">${item.timestamp}</span>` : nothing}
          ${item.resolved
            ? html`<mth-badge size="sm" variant="success">${this.t('resolvedBadge')}</mth-badge>`
            : nothing}
        </div>

        <div class="body" part="body">
          ${renderSafeMarkdown(item.body, { allowRawHtml: this.allowRawHtml })}
        </div>

        <div class="actions">
          ${hasReplies
            ? html`
                <button
                  type="button"
                  class="action-btn"
                  part="reply-toggle"
                  aria-expanded=${isCollapsed ? 'false' : 'true'}
                  @click=${() => this.toggleCollapsed(item.id)}
                >
                  ${this.t(isCollapsed ? 'showReplies' : 'hideReplies', {
                    count: numFmt.format(replies.length),
                  })}
                </button>
              `
            : nothing}

          ${this.allowReply
            ? html`
                <button
                  type="button"
                  class="action-btn"
                  part="reply-button"
                  @click=${() => {
                    this.activeReplyId = this.activeReplyId === item.id ? '' : item.id;
                    this.replyDraft = '';
                  }}
                >
                  ${this.t('replyLabel')}
                </button>
              `
            : nothing}

          ${depth === 0 && this.allowResolve
            ? html`
                <button
                  type="button"
                  class="action-btn"
                  part="resolve-button"
                  @click=${() =>
                    this.emitEvent('mth-resolve-toggle', {
                      detail: { id: item.id, resolved: !item.resolved },
                    })}
                >
                  ${this.t(item.resolved ? 'reopenLabel' : 'resolveLabel')}
                </button>
              `
            : nothing}
        </div>

        ${this.activeReplyId === item.id
          ? html`
              <div class="reply-form">
                <input
                  type="text"
                  class="reply-input"
                  aria-label=${this.t('replyPlaceholder')}
                  placeholder=${this.t('replyPlaceholder')}
                  .value=${this.replyDraft}
                  @input=${(e: Event) => {
                    this.replyDraft = (e.currentTarget as HTMLInputElement).value;
                  }}
                  @keydown=${(e: KeyboardEvent) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      this.submitReply(item.id);
                    }
                  }}
                />
                <button
                  type="button"
                  class="action-btn"
                  @click=${() => this.submitReply(item.id)}
                >
                  ${this.t('submitReplyLabel')}
                </button>
                <button
                  type="button"
                  class="action-btn"
                  @click=${() => {
                    this.activeReplyId = '';
                    this.replyDraft = '';
                  }}
                >
                  ${this.t('cancelLabel')}
                </button>
              </div>
            `
          : nothing}

        ${hasReplies && !isCollapsed
          ? html`
              <div class="replies" part="replies">
                ${replies.map((reply) => this.renderCommentNode(reply, depth + 1))}
              </div>
            `
          : nothing}
      </article>
    `;
  }

  protected override render() {
    const items = this.comments ?? [];

    return html`
      <section class="base" part="base" aria-label=${this.label || this.t('threadLabel')}>
        ${items.length === 0
          ? html`<div class="empty">${this.t('emptyLabel')}</div>`
          : items.map((comment) => this.renderCommentNode(comment, 0))}
      </section>
    `;
  }
}
