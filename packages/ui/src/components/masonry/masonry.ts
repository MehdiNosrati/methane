import { UIElement, type PropertyValues, html, property, query } from '@methane/core';
import { ObserverPoolController } from '@methane/primitives';
import { masonryMessages } from './masonry.messages.js';
import { masonryStyles } from './masonry.styles.js';

const SAFE_CSS_GAP_RE =
  /^(?:0|\d+(?:\.\d+)?(?:px|rem|em|ch|ex|cap|ic|lh|rlh|vw|vh|vi|vb|vmin|vmax|%)|var\(--[a-zA-Z0-9_-]+(?:\s*,\s*(?:0|\d+(?:\.\d+)?(?:px|rem|em|ch|vw|vh|vmin|vmax|%)))?\))$/;

function sanitizeCssGap(raw: string): string {
  const trimmed = raw.trim();
  return SAFE_CSS_GAP_RE.test(trimmed) ? trimmed : 'var(--mth-space-4, 1rem)';
}

/**
 * Responsive masonry layout container using `ObserverPoolController` resize observation.
 */
export class MthMasonry extends UIElement {
  static override styles = masonryStyles;
  static override messages = masonryMessages;

  @property({ type: Number })
  columns = 0;

  @property({ type: Number, attribute: 'min-column-width' })
  minColumnWidth = 240;

  @property({ type: String })
  gap = '1rem';

  @query('[part="base"]')
  private baseEl!: HTMLElement | null;

  private readonly observerPool: ObserverPoolController;
  private dynamicSheet: CSSStyleSheet | null = null;
  private resolvedColumns = 1;
  private observedInlineSize = 0;

  constructor() {
    super();
    this.observerPool = new ObserverPoolController(this);
  }

  private resolveColumnCount(): number {
    if (this.columns > 0) {
      return Math.max(1, Math.floor(this.columns));
    }
    if (this.observedInlineSize > 0) {
      const minCol = Math.max(40, this.minColumnWidth || 240);
      return Math.max(1, Math.floor(this.observedInlineSize / minCol));
    }
    return 1;
  }

  protected override willUpdate(changed: PropertyValues): void {
    super.willUpdate(changed);
    if (changed.has('columns') || changed.has('minColumnWidth')) {
      this.resolvedColumns = this.resolveColumnCount();
    }
  }

  protected override firstUpdated(changed: PropertyValues): void {
    super.firstUpdated(changed);
    if (this.baseEl) {
      this.observerPool.observeResize(this.baseEl, (entry) => {
        this.observedInlineSize = entry.contentRect.width;
        this.recomputeColumns(true);
      });
    }
    this.recomputeColumns(false);
  }

  protected override updated(changed: PropertyValues): void {
    super.updated(changed);
    if (changed.has('columns') || changed.has('minColumnWidth') || changed.has('gap')) {
      this.recomputeColumns(false);
    }
  }

  /**
   * Current resolved column count.
   */
  get computedColumns(): number {
    return this.resolveColumnCount();
  }

  private recomputeColumns(emitOnChange: boolean): void {
    const nextCols = this.resolveColumnCount();
    const changed = nextCols !== this.resolvedColumns;
    this.resolvedColumns = nextCols;
    this.applyDynamicCss(nextCols);

    if (changed) {
      this.requestUpdate();
      if (emitOnChange) {
        this.emitEvent('mth-layout', { detail: { columns: nextCols } });
      }
    }
  }

  private applyDynamicCss(cols: number): void {
    if (
      typeof CSSStyleSheet === 'undefined' ||
      !this.shadowRoot ||
      !('adoptedStyleSheets' in this.shadowRoot)
    ) {
      return;
    }
    if (!this.dynamicSheet) {
      this.dynamicSheet = new CSSStyleSheet();
      this.shadowRoot.adoptedStyleSheets = [
        ...this.shadowRoot.adoptedStyleSheets,
        this.dynamicSheet,
      ];
    }
    const safeGap = sanitizeCssGap(this.gap);
    this.dynamicSheet.replaceSync(
      `[part="base"] { column-count: ${cols}; column-gap: ${safeGap}; } ::slotted(*) { margin-block-end: ${safeGap}; }`,
    );
  }

  override render() {
    return html`<div part="base" data-columns=${String(this.resolvedColumns)}><slot></slot></div>`;
  }
}
