import { UIElement, type PropertyValues } from '@methane/core';
import { html, nothing } from 'lit';
import { property } from 'lit/decorators.js';
import { barcodeMessages } from './barcode.messages.js';
import { barcodeStyles } from './barcode.styles.js';

// ISO/IEC 15417 Code 128 bar/space width patterns (codes 0..106)
const CODE128_PATTERNS: ReadonlyArray<string> = [
  '212222', '222122', '222221', '121223', '121322', '131222', '122213', '122312', '132212', '221213',
  '221312', '231212', '112232', '122132', '122231', '113222', '123122', '123221', '223211', '221132',
  '221231', '213212', '223112', '312131', '311222', '321122', '321221', '312212', '322112', '322211',
  '212123', '212321', '232121', '111323', '131123', '131321', '112313', '132113', '132311', '211313',
  '231113', '231311', '112133', '112331', '132131', '113123', '113321', '133121', '313121', '211331',
  '231131', '213113', '213311', '213131', '311123', '311321', '331121', '312113', '312311', '332111',
  '314111', '221411', '431111', '111224', '111422', '121124', '121421', '141122', '141221', '112214',
  '112412', '122114', '122411', '142112', '142211', '241211', '221114', '413111', '241112', '134111',
  '111242', '121142', '121241', '114212', '124112', '124211', '411212', '421112', '421211', '212141',
  '214121', '412121', '111143', '111341', '131141', '114113', '114311', '411113', '411311', '113141',
  '114131', '311141', '411131', '211412', '211214', '211232', '2331112',
];

export interface BarcodeBar {
  readonly x: number;
  readonly width: number;
}

/**
 * Encodes printable ASCII text (Code Set B) deterministically into ISO/IEC 15417 Code 128 bars.
 */
export function encodeCode128B(value: string): { readonly totalWidth: number; readonly bars: ReadonlyArray<BarcodeBar> } {
  const START_B = 104;
  const STOP = 106;
  const codes: number[] = [START_B];

  for (let i = 0; i < value.length; i++) {
    const ch = value.charCodeAt(i);
    const code = ch >= 32 && ch <= 126 ? ch - 32 : 0;
    codes.push(code);
  }

  let checksum = START_B;
  for (let i = 1; i < codes.length; i++) {
    checksum += codes[i]! * i;
  }
  codes.push(checksum % 103);
  codes.push(STOP);

  const quiet = 10;
  let cursor = quiet;
  const bars: BarcodeBar[] = [];

  for (const symbolCode of codes) {
    const pattern = CODE128_PATTERNS[symbolCode] ?? CODE128_PATTERNS[0]!;
    for (let i = 0; i < pattern.length; i++) {
      const w = Number(pattern[i]);
      if (i % 2 === 0) {
        bars.push({ x: cursor, width: w });
      }
      cursor += w;
    }
  }

  return { totalWidth: cursor + quiet, bars };
}

/**
 * `<mth-barcode>`: zero-dependency deterministic Code 128B SVG barcode generator.
 */
export class MthBarcode extends UIElement {
  static override messages = barcodeMessages;
  static override styles = barcodeStyles;

  @property({ type: String, reflect: true })
  value = '';

  @property({ type: String })
  label = '';

  @property({ type: Number })
  height = 56;

  @property({ type: Boolean, attribute: 'show-value' })
  showValue = true;

  private sizeSheet: CSSStyleSheet | null = null;

  override connectedCallback(): void {
    super.connectedCallback();
    this.syncHeightSheet();
  }

  protected override updated(changed: PropertyValues<this>): void {
    super.updated(changed);
    if (changed.has('height')) {
      this.syncHeightSheet();
    }
  }

  private syncHeightSheet(): void {
    const root = this.shadowRoot;
    if (!root || !('adoptedStyleSheets' in root) || typeof CSSStyleSheet === 'undefined') {
      return;
    }
    if (!this.sizeSheet) {
      this.sizeSheet = new CSSStyleSheet();
    }
    if (typeof this.sizeSheet.replaceSync === 'function') {
      const px = Math.max(24, Math.round(Number.isFinite(this.height) ? this.height : 56));
      this.sizeSheet.replaceSync(`:host { --_barcode-height: ${px}px; }`);
      if (!root.adoptedStyleSheets.includes(this.sizeSheet)) {
        root.adoptedStyleSheets = [...root.adoptedStyleSheets, this.sizeSheet];
      }
    }
  }

  protected override render() {
    const trimmed = this.value;
    if (!trimmed) {
      return html`
        <div class="base" part="base" role="img" aria-label=${this.label || barcodeMessages.emptyLabel}>
          <span class="empty">${barcodeMessages.emptyLabel}</span>
        </div>
      `;
    }

    const { totalWidth, bars } = encodeCode128B(trimmed);
    const viewHeight = Math.max(24, Math.round(Number.isFinite(this.height) ? this.height : 56));
    const accessibleLabel = this.label || `${barcodeMessages.defaultLabel}: ${trimmed}`;
    const d = bars.map((bar) => `M${bar.x},0h${bar.width}v${viewHeight}h-${bar.width}z`).join('');

    return html`
      <div class="base" part="base">
        <svg
          class="svg"
          part="svg"
          viewBox=${`0 0 ${totalWidth} ${viewHeight}`}
          preserveAspectRatio="none"
          role="img"
          aria-label=${accessibleLabel}
        >
          <path d=${d} fill="currentColor"></path>
        </svg>
        ${this.showValue ? html`<span class="caption" part="caption">${trimmed}</span>` : nothing}
      </div>
    `;
  }
}
