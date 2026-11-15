import { UIElement, html, nothing, property, query, state, type PropertyValues, type TemplateResult } from '@methane/core';
import { ClipboardAndShare } from '@methane/primitives';
import {
  createStreamSanitizer,
  isSafeUrl,
  safeSetMarkdown,
  type StreamSanitizer,
} from '@methane/sanitize';
import { aiMessageMessages } from './ai-message.messages.js';
import { aiMessageStyles } from './ai-message.styles.js';

export type MthAiMessageRole = 'user' | 'assistant' | 'system';

const INLINE_TOKEN_RE = /(`[^`\n]+`|\[[^\]]+\]\([^)\s]+\)|\*\*[^*\n]+\*\*|\*[^*\n]+\*)/g;

function renderInlineMarkdown(text: string): Array<string | TemplateResult> {
  const parts: Array<string | TemplateResult> = [];
  let lastIndex = 0;

  for (const match of text.matchAll(INLINE_TOKEN_RE)) {
    const token = match[0];
    const index = match.index ?? 0;
    if (index > lastIndex) {
      parts.push(text.slice(lastIndex, index));
    }

    if (token.startsWith('`') && token.endsWith('`')) {
      parts.push(html`<code>${token.slice(1, -1)}</code>`);
    } else if (token.startsWith('[')) {
      const sep = token.indexOf('](');
      const label = token.slice(1, sep);
      const rawUrl = token.slice(sep + 2, -1);
      if (isSafeUrl(rawUrl)) {
        parts.push(html`<a href=${rawUrl.trim()} rel="noopener noreferrer">${label}</a>`);
      } else {
        parts.push(label);
      }
    } else if (token.startsWith('**') && token.endsWith('**')) {
      parts.push(html`<strong>${token.slice(2, -2)}</strong>`);
    } else if (token.startsWith('*') && token.endsWith('*')) {
      parts.push(html`<em>${token.slice(1, -1)}</em>`);
    } else {
      parts.push(token);
    }

    lastIndex = index + token.length;
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts;
}

function renderSafeMarkdownParagraphs(markdown: string): Array<TemplateResult> {
  if (!markdown) return [];
  const blocks = markdown.split(/\n{2,}/);
  return blocks.map((block) => {
    const lines = block.split('\n');
    return html`<p>
      ${lines.map((line, i) =>
        i > 0 ? html`<br />${renderInlineMarkdown(line)}` : renderInlineMarkdown(line),
      )}
    </p>`;
  });
}

/**
 * `<mth-ai-message>`: streaming-ready AI message component enforcing ADR-012
 * `@methane/sanitize` content safety with `allowRawHtml: false` by default.
 */
export class MthAiMessage extends UIElement {
  static override messages = aiMessageMessages;
  static override styles = aiMessageStyles;

  @property({ type: String, reflect: true })
  override role: MthAiMessageRole = 'assistant';

  @property({ type: String })
  content = '';

  @property({ type: Boolean, attribute: 'allow-raw-html' })
  allowRawHtml = false;

  @property({ type: Boolean, reflect: true })
  streaming = false;

  @property({ type: String })
  author = '';

  @property({ type: String })
  timestamp = '';

  @property({ type: Boolean, attribute: 'show-actions' })
  showActions = true;

  @state()
  private copied = false;

  @query('[part="sanitized-content"]')
  private sanitizedContentEl!: HTMLElement | null;

  private streamSanitizer: StreamSanitizer;
  private copiedTimer: ReturnType<typeof setTimeout> | null = null;
  private hasHydratedRawHtml = false;

  constructor() {
    super();
    this.streamSanitizer = createStreamSanitizer({ allowRawHtml: false });
  }

  override connectedCallback(): void {
    super.connectedCallback();
    this.setCustomState('streaming', this.streaming);
    this.setCustomState('copied', this.copied);
  }

  override disconnectedCallback(): void {
    if (this.copiedTimer !== null) {
      clearTimeout(this.copiedTimer);
      this.copiedTimer = null;
    }
    super.disconnectedCallback();
  }

  protected override willUpdate(changedProperties: PropertyValues): void {
    super.willUpdate(changedProperties);
    if (changedProperties.has('allowRawHtml')) {
      this.streamSanitizer = createStreamSanitizer({ allowRawHtml: this.allowRawHtml });
      if (this.content) {
        this.streamSanitizer.push(this.content);
      }
    }
    if (changedProperties.has('streaming')) {
      this.setCustomState('streaming', this.streaming);
    }
    if (changedProperties.has('copied')) {
      this.setCustomState('copied', this.copied);
    }
  }

  protected override updated(changedProperties: PropertyValues): void {
    super.updated(changedProperties);
    if (
      this.allowRawHtml &&
      this.sanitizedContentEl &&
      (changedProperties.has('content') || changedProperties.has('allowRawHtml') || !this.hasHydratedRawHtml)
    ) {
      this.hasHydratedRawHtml = true;
      safeSetMarkdown(this.sanitizedContentEl, this.content, { allowRawHtml: true });
    }
  }

  pushChunk(chunk: string): void {
    this.streamSanitizer.push(chunk);
    this.content = `${this.content}${chunk}`;
    if (this.allowRawHtml && this.sanitizedContentEl) {
      this.streamSanitizer.flushTo(this.sanitizedContentEl);
    }
  }

  resetStream(): void {
    this.streamSanitizer.reset();
    this.content = '';
    if (this.sanitizedContentEl && this.allowRawHtml) {
      safeSetMarkdown(this.sanitizedContentEl, '', { allowRawHtml: true });
    }
  }

  async copy(): Promise<boolean> {
    const result = await ClipboardAndShare.copyText(this.content);
    this.copied = result.ok;
    this.setCustomState('copied', this.copied);
    if (result.ok) {
      if (this.copiedTimer !== null) {
        clearTimeout(this.copiedTimer);
      }
      this.copiedTimer = setTimeout(() => {
        this.copied = false;
        this.setCustomState('copied', false);
        this.copiedTimer = null;
      }, 2000);
    }
    this.emitEvent('mth-copy', { detail: { content: this.content, ok: result.ok } });
    return result.ok;
  }

  regenerate(): void {
    this.emitEvent('mth-regenerate', { detail: { content: this.content } });
  }

  private resolveAuthorLabel(): string {
    if (this.author) return this.author;
    if (this.role === 'user') return this.t('userLabel');
    if (this.role === 'system') return this.t('systemLabel');
    return this.t('assistantLabel');
  }

  private readonly handleCopyClick = (): void => {
    void this.copy();
  };

  private readonly handleRegenerateClick = (): void => {
    this.regenerate();
  };

  override render() {
    const authorLabel = this.resolveAuthorLabel();
    const copyLabel = this.copied ? this.t('copiedLabel') : this.t('copyLabel');

    return html`
      <article
        class="base"
        part="base"
        aria-label=${this.t('regionLabel', { role: authorLabel })}
        aria-busy=${this.streaming ? 'true' : 'false'}
      >
        <div class="avatar-col" part="avatar">
          <slot name="avatar">
            <mth-avatar name=${authorLabel} size="sm"></mth-avatar>
          </slot>
        </div>

        <div class="main">
          <header class="header" part="header">
            <slot name="header">
              <span class="author">${authorLabel}</span>
              ${this.streaming
                ? html`<mth-badge variant="accent" size="sm" pill>${this.t('streamingLabel')}</mth-badge>`
                : nothing}
              ${this.timestamp ? html`<span class="timestamp">${this.timestamp}</span>` : nothing}
            </slot>
          </header>

          <div class="content" part="content" aria-live=${this.streaming ? 'polite' : 'off'}>
            <div ?hidden=${this.allowRawHtml}>
              ${this.allowRawHtml ? nothing : renderSafeMarkdownParagraphs(this.content)}
            </div>
            <div part="sanitized-content" ?hidden=${!this.allowRawHtml}></div>
            ${this.streaming ? html`<span class="cursor" part="cursor" aria-hidden="true"></span>` : nothing}
          </div>

          <slot></slot>

          ${this.showActions
            ? html`
                <div class="actions" part="actions">
                  <mth-button
                    variant="ghost"
                    size="sm"
                    part="copy-button"
                    @click=${this.handleCopyClick}
                  >
                    <mth-icon name=${this.copied ? 'check' : 'copy'} size="xs"></mth-icon>
                    <span>${copyLabel}</span>
                  </mth-button>
                  ${this.role === 'assistant'
                    ? html`
                        <mth-button
                          variant="ghost"
                          size="sm"
                          part="regenerate-button"
                          @click=${this.handleRegenerateClick}
                        >
                          ${this.t('regenerateLabel')}
                        </mth-button>
                      `
                    : nothing}
                  <slot name="actions"></slot>
                </div>
              `
            : nothing}

          <div part="footer">
            <slot name="footer"></slot>
          </div>
        </div>
      </article>
    `;
  }
}
