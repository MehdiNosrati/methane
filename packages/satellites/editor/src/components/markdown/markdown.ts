import { UIElement, type PropertyValues } from '@methane-ui/core';
import { html } from 'lit';
import { property, query } from 'lit/decorators.js';
import { compileMarkdownToSafeHtml, renderMarkdownIntoElement } from '../../shared/markdown-render.js';
import { readHostTokenValue, syncTokenStylesheet } from '../../shared/theme-sync.js';
import { markdownMessages } from './markdown.messages.js';
import { markdownStyles } from './markdown.styles.js';

const TRACKED_TOKENS = [
  '--mth-color-surface',
  '--mth-color-bg-subtle',
  '--mth-color-fg',
  '--mth-color-fg-muted',
  '--mth-color-border',
  '--mth-color-accent',
] as const;

export interface MarkdownRendererEngine {
  render(markdown?: string): string;
  getThemeToken(tokenName: string): string;
  destroy(): void;
}

/**
 * `<mth-markdown>`: Read-only sanitized Markdown renderer wrapping `@methane-ui/sanitize`
 * with raw HTML disabled by default and token synchronization.
 */
export class MthMarkdown extends UIElement {
  static override shadowRootOptions: ShadowRootInit = {
    mode: 'open',
  };
  static override messages = markdownMessages;
  static override styles = [markdownStyles];

  @property({ type: String })
  content = '';

  @property({ type: String })
  label = '';

  @property({ type: Boolean, attribute: 'allow-raw-html' })
  allowRawHtml = false;

  @query('#mth-md-content')
  private contentEl!: HTMLElement | null;

  @query('#mth-md-slot')
  private defaultSlotEl!: HTMLSlotElement | null;

  private _engine: MarkdownRendererEngine | null = null;
  private tokenSheet: CSSStyleSheet | null = null;
  private readonly tokenCache = new Map<string, string>();
  private styleObserver: MutationObserver | null = null;
  private deferRenderTimer: ReturnType<typeof setTimeout> | null = null;
  private wasSsrHydrated = false;

  get engine(): MarkdownRendererEngine | null {
    return this._engine;
  }

  override connectedCallback(): void {
    this.wasSsrHydrated = !this.hasUpdated && Boolean(this.shadowRoot?.querySelector('[part="base"]'));
    super.connectedCallback();
    this.ensureEngine();
    this.attachStyleObserver();
    this.syncThemeTokens();
    if (this.hasUpdated) {
      this.renderMarkdown();
    }
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    if (this.deferRenderTimer !== null) {
      clearTimeout(this.deferRenderTimer);
      this.deferRenderTimer = null;
    }
    this.wasSsrHydrated = false;
    this.styleObserver?.disconnect();
    this.styleObserver = null;
    this._engine?.destroy();
    this._engine = null;
  }

  syncThemeTokens(): void {
    if (!this.tokenSheet && typeof CSSStyleSheet !== 'undefined') {
      this.tokenSheet = new CSSStyleSheet();
    }
    syncTokenStylesheet(
      this,
      this.shadowRoot,
      this.tokenSheet,
      this.tokenCache,
      TRACKED_TOKENS,
    );
  }

  protected override firstUpdated(changed: PropertyValues): void {
    super.firstUpdated(changed);
    this.syncThemeTokens();
    if (this.wasSsrHydrated) {
      this.deferRenderTimer = setTimeout(() => {
        this.deferRenderTimer = null;
        this.renderMarkdown();
      }, 0);
    } else {
      this.renderMarkdown();
    }
  }

  protected override updated(changed: PropertyValues): void {
    super.updated(changed);
    if (changed.has('content') || changed.has('allowRawHtml')) {
      if (!this.wasSsrHydrated || this.deferRenderTimer === null) {
        this.renderMarkdown();
      }
    }
  }

  private attachStyleObserver(): void {
    if (typeof MutationObserver === 'undefined') return;
    this.styleObserver?.disconnect();
    this.styleObserver = new MutationObserver(() => {
      this.syncThemeTokens();
    });
    this.styleObserver.observe(this, { attributes: true, attributeFilter: ['style'] });
  }

  private ensureEngine(): void {
    if (this._engine) return;
    this._engine = {
      render: (markdown?: string) => {
        const source = markdown ?? this.resolveSourceMarkdown();
        return compileMarkdownToSafeHtml(source, { allowRawHtml: this.allowRawHtml });
      },
      getThemeToken: (tokenName: string) => {
        return readHostTokenValue(this, tokenName) || this.tokenCache.get(tokenName) || '';
      },
      destroy: () => {
        // Released on disconnect
      },
    };
  }

  private resolveSourceMarkdown(): string {
    if (this.content) return this.content;
    const nodes = this.defaultSlotEl?.assignedNodes({ flatten: true }) ?? [];
    if (nodes.length === 0) return '';
    return nodes
      .map((n) => n.textContent ?? '')
      .join('')
      .trim();
  }

  private renderMarkdown(): void {
    if (!this.contentEl) return;
    const source = this.resolveSourceMarkdown();
    renderMarkdownIntoElement(this.contentEl, source, { allowRawHtml: this.allowRawHtml });
    this.setCustomState('rendered', source.length > 0);
    this.emitEvent('mth-render', { detail: { length: source.length } });
  }

  private handleSlotChange(): void {
    if (this.wasSsrHydrated && this.deferRenderTimer !== null) return;
    if (!this.content) {
      this.renderMarkdown();
    }
  }

  protected override render() {
    const regionLabel = this.label.trim() || this.t('regionLabel');

    return html`
      <div part="base" role="region" aria-label=${regionLabel}>
        <div id="mth-md-content" part="content"></div>
        <div part="source" hidden>
          <slot id="mth-md-slot" @slotchange=${this.handleSlotChange}></slot>
        </div>
        <div part="fallback">
          <slot name="fallback"></slot>
        </div>
      </div>
    `;
  }
}
