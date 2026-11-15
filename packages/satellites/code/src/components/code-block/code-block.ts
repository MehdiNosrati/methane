import { UIElement, type PropertyValues } from '@methane-ui/core';
import { ClipboardAndShare } from '@methane-ui/primitives';
import { html, nothing } from 'lit';
import { property, query, state } from 'lit/decorators.js';
import { readHostTokenValue, syncTokenStylesheet } from '../../shared/theme-sync.js';
import { parseHighlightLines, tokenizeLine, type TokenKind } from '../../shared/tokenizer.js';
import { codeBlockMessages } from './code-block.messages.js';
import { codeBlockStyles } from './code-block.styles.js';

const TRACKED_TOKENS = [
  '--mth-color-surface',
  '--mth-color-bg-subtle',
  '--mth-color-fg',
  '--mth-color-fg-muted',
  '--mth-color-border',
  '--mth-color-accent',
] as const;

const HIGHLIGHT_KINDS: ReadonlyArray<Exclude<TokenKind, 'plain'>> = [
  'keyword',
  'string',
  'comment',
  'number',
  'operator',
];

export interface CodeBlockEngine {
  readonly highlightApiSupported: boolean;
  copy(): Promise<boolean>;
  getThemeToken(tokenName: string): string;
  destroy(): void;
}

type HighlightRegistry = Map<string, Set<Range>>;

function getCssHighlightRegistry(): HighlightRegistry | null {
  if (typeof CSS === 'undefined' || !('highlights' in CSS)) return null;
  const reg = (CSS as unknown as { highlights?: HighlightRegistry }).highlights;
  return reg ?? null;
}

function createCssHighlight(ranges: ReadonlyArray<Range>): Set<Range> {
  const Ctor = (globalThis as unknown as { Highlight?: new (...r: Array<Range>) => Set<Range> })
    .Highlight;
  if (typeof Ctor === 'function') {
    return new Ctor(...ranges);
  }
  return new Set(ranges);
}

/**
 * `<mth-code-block>`: Syntax-highlighted read-only code display using the
 * CSS Custom Highlight API when supported with accessible `<span>` fallback,
 * line highlighting, copy action, and `--mth-*` token synchronization.
 */
export class MthCodeBlock extends UIElement {
  static override shadowRootOptions: ShadowRootInit = {
    mode: 'open',
    delegatesFocus: true,
  };
  static override messages = codeBlockMessages;
  static override styles = [codeBlockStyles];

  @property({ type: String })
  code = '';

  @property({ type: String, reflect: true })
  language = 'text';

  @property({ type: String })
  label = '';

  @property({ type: Boolean, reflect: true, attribute: 'line-numbers' })
  lineNumbers = false;

  @property({ type: String, attribute: 'highlight-lines' })
  highlightLines = '';

  @property({ type: Boolean, attribute: 'show-copy' })
  showCopy = true;

  @state()
  private copied = false;

  @state()
  private slottedCode = '';

  @query('#mth-cb-code')
  private codeEl!: HTMLElement | null;

  @query('#mth-cb-slot')
  private defaultSlotEl!: HTMLSlotElement | null;

  private _engine: CodeBlockEngine | null = null;
  private tokenSheet: CSSStyleSheet | null = null;
  private readonly tokenCache = new Map<string, string>();
  private styleObserver: MutationObserver | null = null;
  private copiedTimer: ReturnType<typeof setTimeout> | null = null;
  private deferHighlightTimer: ReturnType<typeof setTimeout> | null = null;
  private wasSsrHydrated = false;
  private readonly ownedHighlightRanges = new Map<string, Array<Range>>();

  get engine(): CodeBlockEngine | null {
    return this._engine;
  }

  override connectedCallback(): void {
    this.wasSsrHydrated = !this.hasUpdated && Boolean(this.shadowRoot?.querySelector('[part="base"]'));
    super.connectedCallback();
    this.ensureEngine();
    this.attachStyleObserver();
    this.syncThemeTokens();
    if (this.hasUpdated) {
      this.syncCustomHighlights();
    }
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    if (this.copiedTimer !== null) {
      clearTimeout(this.copiedTimer);
      this.copiedTimer = null;
    }
    if (this.deferHighlightTimer !== null) {
      clearTimeout(this.deferHighlightTimer);
      this.deferHighlightTimer = null;
    }
    this.wasSsrHydrated = false;
    this.styleObserver?.disconnect();
    this.styleObserver = null;
    this.clearCustomHighlights();
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

  async copyCode(): Promise<boolean> {
    const text = this.resolveCode();
    const res = await ClipboardAndShare.copyText(text);
    if (!res.ok) {
      return false;
    }
    this.copied = true;
    this.setCustomState('copied', true);
    this.emitEvent('mth-copy', { detail: { code: text } });
    if (this.copiedTimer !== null) clearTimeout(this.copiedTimer);
    this.copiedTimer = setTimeout(() => {
      this.copied = false;
      this.setCustomState('copied', false);
      this.copiedTimer = null;
    }, 2000);
    return true;
  }

  protected override firstUpdated(changed: PropertyValues): void {
    super.firstUpdated(changed);
    this.syncThemeTokens();
    if (this.wasSsrHydrated) {
      this.deferHighlightTimer = setTimeout(() => {
        this.deferHighlightTimer = null;
        if (!this.code && this.defaultSlotEl) {
          const nodes = this.defaultSlotEl.assignedNodes({ flatten: true }) ?? [];
          const text = nodes.map((n) => n.textContent ?? '').join('');
          if (text) this.slottedCode = text;
        }
        this.syncCustomHighlights();
      }, 0);
    } else {
      this.syncCustomHighlights();
    }
  }

  protected override willUpdate(changed: PropertyValues): void {
    super.willUpdate(changed);
    if (changed.has('lineNumbers')) {
      this.setCustomState('line-numbers', this.lineNumbers);
    }
  }

  protected override updated(changed: PropertyValues): void {
    super.updated(changed);
    if (changed.has('code') || changed.has('slottedCode') || changed.has('language')) {
      if (!this.wasSsrHydrated || this.deferHighlightTimer === null) {
        this.syncCustomHighlights();
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
    const isHighlightSupported = (): boolean => getCssHighlightRegistry() !== null;
    this._engine = {
      get highlightApiSupported() {
        return isHighlightSupported();
      },
      copy: () => this.copyCode(),
      getThemeToken: (tokenName: string) =>
        readHostTokenValue(this, tokenName) || this.tokenCache.get(tokenName) || '',
      destroy: () => {
        this.clearCustomHighlights();
      },
    };
  }

  private resolveCode(): string {
    return this.code || this.slottedCode;
  }

  private handleSlotChange(): void {
    if (this.wasSsrHydrated && this.deferHighlightTimer !== null) return;
    const nodes = this.defaultSlotEl?.assignedNodes({ flatten: true }) ?? [];
    this.slottedCode = nodes.map((n) => n.textContent ?? '').join('');
  }

  private clearCustomHighlights(): void {
    const registry = getCssHighlightRegistry();
    if (!registry) {
      this.ownedHighlightRanges.clear();
      return;
    }
    for (const [key, ranges] of this.ownedHighlightRanges) {
      const entry = registry.get(key);
      if (!entry) continue;
      for (const range of ranges) {
        entry.delete(range);
      }
    }
    this.ownedHighlightRanges.clear();
  }

  private syncCustomHighlights(): void {
    this.clearCustomHighlights();
    const registry = getCssHighlightRegistry();
    if (!registry || !this.codeEl) {
      this.setCustomState('custom-highlight', false);
      return;
    }

    const lineNodes = Array.from(this.codeEl.querySelectorAll<HTMLElement>('[part="line"]'));
    const nextBuckets = new Map<TokenKind, Array<Range>>();
    for (const kind of HIGHLIGHT_KINDS) {
      nextBuckets.set(kind, []);
    }

    for (const lineEl of lineNodes) {
      const codeTextNode = lineEl.querySelector('.cb-line-text')?.firstChild;
      if (!codeTextNode || codeTextNode.nodeType !== Node.TEXT_NODE) continue;
      const lineStr = codeTextNode.textContent ?? '';
      const tokens = tokenizeLine(lineStr, this.language);
      for (const tok of tokens) {
        if (tok.kind === 'plain') continue;
        const range = document.createRange();
        range.setStart(codeTextNode, tok.start);
        range.setEnd(codeTextNode, tok.end);
        nextBuckets.get(tok.kind)?.push(range);
      }
    }

    for (const kind of HIGHLIGHT_KINDS) {
      const key = `mth-${kind}`;
      const ranges = nextBuckets.get(kind) ?? [];
      if (ranges.length === 0) continue;
      this.ownedHighlightRanges.set(key, ranges);
      const existing = registry.get(key);
      if (existing) {
        for (const r of ranges) existing.add(r);
      } else {
        registry.set(key, createCssHighlight(ranges));
      }
    }
    this.setCustomState('custom-highlight', true);
  }

  protected override render() {
    const source = this.resolveCode();
    const lines = source ? source.replace(/\r\n?/g, '\n').split('\n') : [''];
    const highlighted = parseHighlightLines(this.highlightLines);
    const useCssHighlight = getCssHighlightRegistry() !== null;
    const regionLabel = this.label.trim() || this.t('regionLabel');
    const langDisplay = this.language.trim() || this.t('languageFallback');

    return html`
      <div part="base" role="region" aria-label=${regionLabel}>
        <div part="header">
          <span part="language">${langDisplay}</span>
          ${this.showCopy
            ? html`
                <button
                  part="copy-button"
                  type="button"
                  @click=${() => void this.copyCode()}
                >
                  ${this.copied ? this.t('copiedLabel') : this.t('copyLabel')}
                </button>
              `
            : nothing}
        </div>

        <pre part="pre"><code id="mth-cb-code" part="code">${lines.map((line, idx) => {
          const lineNum = idx + 1;
          const isHighlighted = highlighted.has(lineNum);
          const tokens = useCssHighlight ? null : tokenizeLine(line, this.language);
          return html`<span part="line" data-highlighted=${isHighlighted ? 'true' : nothing}>${
            this.lineNumbers
              ? html`<span part="line-number" aria-hidden="true">${lineNum}</span>`
              : nothing
          }<span class="cb-line-text">${
            tokens
              ? tokens.map((t) =>
                  t.kind === 'plain'
                    ? t.text
                    : html`<span part="token" data-token=${t.kind}>${t.text}</span>`,
                )
              : line
          }</span></span>`;
        })}</code></pre>

        <div part="status" role="status" class="sr-only">
          ${this.copied ? this.t('copySuccessStatus') : ''}
        </div>
        <div part="source" hidden>
          <slot id="mth-cb-slot" @slotchange=${this.handleSlotChange}></slot>
        </div>
        <div part="fallback">
          <slot name="fallback"></slot>
        </div>
      </div>
    `;
  }
}
