import { UIElement, type PropertyValues } from '@methane/core';
import { html } from 'lit';
import { property } from 'lit/decorators.js';
import { qrCodeMessages } from './qr-code.messages.js';
import { qrCodeStyles } from './qr-code.styles.js';

export type QrErrorCorrection = 'L' | 'M' | 'Q' | 'H';

interface QrVersionSpec {
  readonly version: number;
  readonly size: number;
  readonly alignment: ReadonlyArray<number>;
  readonly capacities: Record<QrErrorCorrection, { readonly dataBytes: number; readonly eccBytes: number }>;
}

const QR_VERSIONS: ReadonlyArray<QrVersionSpec> = [
  {
    version: 1,
    size: 21,
    alignment: [],
    capacities: {
      L: { dataBytes: 19, eccBytes: 7 },
      M: { dataBytes: 16, eccBytes: 10 },
      Q: { dataBytes: 13, eccBytes: 13 },
      H: { dataBytes: 9, eccBytes: 17 },
    },
  },
  {
    version: 2,
    size: 25,
    alignment: [6, 18],
    capacities: {
      L: { dataBytes: 34, eccBytes: 10 },
      M: { dataBytes: 28, eccBytes: 16 },
      Q: { dataBytes: 22, eccBytes: 22 },
      H: { dataBytes: 16, eccBytes: 28 },
    },
  },
  {
    version: 3,
    size: 29,
    alignment: [6, 22],
    capacities: {
      L: { dataBytes: 55, eccBytes: 15 },
      M: { dataBytes: 44, eccBytes: 26 },
      Q: { dataBytes: 34, eccBytes: 18 },
      H: { dataBytes: 26, eccBytes: 22 },
    },
  },
  {
    version: 4,
    size: 33,
    alignment: [6, 26],
    capacities: {
      L: { dataBytes: 80, eccBytes: 20 },
      M: { dataBytes: 64, eccBytes: 18 },
      Q: { dataBytes: 48, eccBytes: 26 },
      H: { dataBytes: 36, eccBytes: 16 },
    },
  },
];

const EC_FORMAT_BITS: Record<QrErrorCorrection, number> = {
  L: 1,
  M: 0,
  Q: 3,
  H: 2,
};

const GF_EXP = new Uint8Array(512);
const GF_LOG = new Uint8Array(256);
(() => {
  let x = 1;
  for (let i = 0; i < 255; i++) {
    GF_EXP[i] = x;
    GF_LOG[x] = i;
    x <<= 1;
    if (x & 0x100) {
      x ^= 0x11d;
    }
  }
  for (let i = 255; i < 512; i++) {
    GF_EXP[i] = GF_EXP[i - 255]!;
  }
})();

function gfMul(a: number, b: number): number {
  if (a === 0 || b === 0) return 0;
  return GF_EXP[(GF_LOG[a]! + GF_LOG[b]!) % 255]!;
}

function buildRsGenerator(degree: number): Uint8Array {
  let poly = new Uint8Array([1]);
  for (let i = 0; i < degree; i++) {
    const next = new Uint8Array(poly.length + 1);
    const root = GF_EXP[i]!;
    for (let j = 0; j < poly.length; j++) {
      next[j]! ^= poly[j]!;
      next[j + 1]! ^= gfMul(poly[j]!, root);
    }
    poly = next;
  }
  return poly;
}

function computeReedSolomon(data: Uint8Array, eccCount: number): Uint8Array {
  const gen = buildRsGenerator(eccCount);
  const rem = new Uint8Array(eccCount);
  for (const byte of data) {
    const factor = byte ^ (rem[0] ?? 0);
    rem.copyWithin(0, 1);
    rem[eccCount - 1] = 0;
    for (let j = 0; j < eccCount; j++) {
      rem[j]! ^= gfMul(gen[j + 1]!, factor);
    }
  }
  return rem;
}

function bchFormatBits(dataBits: number): number {
  let d = dataBits << 10;
  const poly = 0x537;
  for (let shift = 14; shift >= 10; shift--) {
    if ((d >> shift) & 1) {
      d ^= poly << (shift - 10);
    }
  }
  return ((dataBits << 10) | d) ^ 0x5412;
}

/**
 * Generates a deterministic ISO/IEC 18004 QR Code matrix for any UTF-8 string.
 */
export function encodeQrMatrix(value: string, ec: QrErrorCorrection = 'M'): ReadonlyArray<ReadonlyArray<boolean>> {
  const bytes = new TextEncoder().encode(value);
  const spec =
    QR_VERSIONS.find((v) => v.capacities[ec].dataBytes >= bytes.length + 2) ??
    QR_VERSIONS[QR_VERSIONS.length - 1]!;

  const { dataBytes, eccBytes } = spec.capacities[ec];
  const payload = bytes.slice(0, Math.max(0, dataBytes - 2));

  const bitBuffer: number[] = [];
  const pushBits = (val: number, count: number): void => {
    for (let i = count - 1; i >= 0; i--) {
      bitBuffer.push((val >> i) & 1);
    }
  };

  pushBits(0b0100, 4); // Byte mode
  pushBits(payload.length, 8);
  for (const b of payload) {
    pushBits(b, 8);
  }
  const maxDataBits = dataBytes * 8;
  pushBits(0, Math.min(4, maxDataBits - bitBuffer.length));
  while (bitBuffer.length % 8 !== 0) {
    bitBuffer.push(0);
  }
  let padIndex = 0;
  while (bitBuffer.length < maxDataBits) {
    pushBits(padIndex % 2 === 0 ? 0xec : 0x11, 8);
    padIndex += 1;
  }

  const codewords = new Uint8Array(dataBytes);
  for (let i = 0; i < dataBytes; i++) {
    let byte = 0;
    for (let b = 0; b < 8; b++) {
      byte = (byte << 1) | (bitBuffer[i * 8 + b] ?? 0);
    }
    codewords[i] = byte;
  }

  const ecc = computeReedSolomon(codewords, eccBytes);
  const allBytes = new Uint8Array(dataBytes + eccBytes);
  allBytes.set(codewords, 0);
  allBytes.set(ecc, dataBytes);

  const n = spec.size;
  const grid: Array<Array<boolean>> = Array.from({ length: n }, () => Array<boolean>(n).fill(false));
  const reserved: Array<Array<boolean>> = Array.from({ length: n }, () => Array<boolean>(n).fill(false));

  const setModule = (r: number, c: number, dark: boolean, isFunc = true): void => {
    if (r < 0 || r >= n || c < 0 || c >= n) return;
    grid[r]![c] = dark;
    if (isFunc) reserved[r]![c] = true;
  };

  const drawFinder = (row: number, col: number): void => {
    for (let dr = -1; dr <= 7; dr++) {
      for (let dc = -1; dc <= 7; dc++) {
        const r = row + dr;
        const c = col + dc;
        if (r < 0 || r >= n || c < 0 || c >= n) continue;
        const inOuter = dr >= 0 && dr <= 6 && dc >= 0 && dc <= 6;
        const onRing = dr === 0 || dr === 6 || dc === 0 || dc === 6;
        const inCenter = dr >= 2 && dr <= 4 && dc >= 2 && dc <= 4;
        setModule(r, c, inOuter && (onRing || inCenter), true);
      }
    }
  };

  drawFinder(0, 0);
  drawFinder(0, n - 7);
  drawFinder(n - 7, 0);

  for (let i = 8; i < n - 8; i++) {
    setModule(6, i, i % 2 === 0, true);
    setModule(i, 6, i % 2 === 0, true);
  }
  setModule(n - 8, 8, true, true);

  for (const rCenter of spec.alignment) {
    for (const cCenter of spec.alignment) {
      if (reserved[rCenter]?.[cCenter]) continue;
      for (let dr = -2; dr <= 2; dr++) {
        for (let dc = -2; dc <= 2; dc++) {
          const dark = Math.max(Math.abs(dr), Math.abs(dc)) !== 1;
          setModule(rCenter + dr, cCenter + dc, dark, true);
        }
      }
    }
  }

  for (let i = 0; i < 9; i++) {
    if (i !== 6) {
      reserved[8]![i] = true;
      reserved[i]![8] = true;
    }
  }
  for (let i = n - 8; i < n; i++) {
    reserved[8]![i] = true;
    reserved[i]![8] = true;
  }

  let bitIdx = 0;
  const totalBits = allBytes.length * 8;
  let upward = true;
  for (let col = n - 1; col >= 1; col -= 2) {
    if (col === 6) col -= 1;
    for (let step = 0; step < n; step++) {
      const r = upward ? n - 1 - step : step;
      for (const c of [col, col - 1]) {
        if (!reserved[r]![c]) {
          const byte = allBytes[bitIdx >> 3] ?? 0;
          const bit = ((byte >> (7 - (bitIdx & 7))) & 1) === 1;
          grid[r]![c] = bit;
          bitIdx = Math.min(totalBits, bitIdx + 1);
        }
      }
    }
    upward = !upward;
  }

  // Mask pattern 0: (r + c) % 2 === 0
  const maskId = 0;
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      if (!reserved[r]![c] && (r + c) % 2 === 0) {
        grid[r]![c] = !grid[r]![c];
      }
    }
  }

  const fmt = bchFormatBits((EC_FORMAT_BITS[ec] << 3) | maskId);
  for (let i = 0; i < 15; i++) {
    const bit = ((fmt >> i) & 1) === 1;
    if (i < 6) setModule(i, 8, bit, true);
    else if (i < 8) setModule(i + 1, 8, bit, true);
    else setModule(n - 15 + i, 8, bit, true);

    if (i < 8) setModule(8, n - 1 - i, bit, true);
    else if (i < 9) setModule(8, 15 - i, bit, true);
    else setModule(8, 14 - i, bit, true);
  }

  return grid;
}

/**
 * `<mth-qr-code>`: zero-dependency deterministic SVG QR Code renderer with accessible label.
 */
export class MthQrCode extends UIElement {
  static override messages = qrCodeMessages;
  static override styles = qrCodeStyles;

  @property({ type: String, reflect: true })
  value = '';

  @property({ type: String })
  label = '';

  @property({ type: Number })
  size = 160;

  @property({ type: String, attribute: 'error-correction' })
  errorCorrection: QrErrorCorrection = 'M';

  @property({ type: Number, attribute: 'quiet-zone' })
  quietZone = 2;

  private sizeSheet: CSSStyleSheet | null = null;

  override connectedCallback(): void {
    super.connectedCallback();
    this.syncSizeSheet();
  }

  protected override updated(changed: PropertyValues<this>): void {
    super.updated(changed);
    if (changed.has('size')) {
      this.syncSizeSheet();
    }
  }

  private syncSizeSheet(): void {
    const root = this.shadowRoot;
    if (!root || !('adoptedStyleSheets' in root) || typeof CSSStyleSheet === 'undefined') {
      return;
    }
    if (!this.sizeSheet) {
      this.sizeSheet = new CSSStyleSheet();
    }
    if (typeof this.sizeSheet.replaceSync === 'function') {
      const px = Math.max(48, Math.round(Number.isFinite(this.size) ? this.size : 160));
      this.sizeSheet.replaceSync(`:host { --_qr-size: ${px}px; }`);
      if (!root.adoptedStyleSheets.includes(this.sizeSheet)) {
        root.adoptedStyleSheets = [...root.adoptedStyleSheets, this.sizeSheet];
      }
    }
  }

  protected override render() {
    const trimmed = this.value.trim();
    if (!trimmed) {
      return html`
        <div class="base" part="base" role="img" aria-label=${this.label || qrCodeMessages.emptyLabel}>
          <span class="empty">${qrCodeMessages.emptyLabel}</span>
        </div>
      `;
    }

    const matrix = encodeQrMatrix(trimmed, this.errorCorrection);
    const pad = Math.max(0, Math.min(8, Math.trunc(this.quietZone)));
    const total = matrix.length + pad * 2;
    const accessibleLabel = this.label || `${qrCodeMessages.defaultLabel}: ${trimmed}`;

    const commands: string[] = [];
    for (let r = 0; r < matrix.length; r++) {
      const row = matrix[r]!;
      for (let c = 0; c < row.length; c++) {
        if (row[c]) {
          commands.push(`M${c + pad},${r + pad}h1v1h-1z`);
        }
      }
    }

    return html`
      <div class="base" part="base">
        <svg
          class="svg"
          part="svg"
          viewBox=${`0 0 ${total} ${total}`}
          role="img"
          aria-label=${accessibleLabel}
        >
          <path d=${commands.join('')} fill="currentColor"></path>
        </svg>
      </div>
    `;
  }
}
