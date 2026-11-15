import { UIElement, type PropertyValues, html, nothing, property, query } from '@methane/core';
import { imageCropperMessages } from './image-cropper.messages.js';
import { imageCropperStyles } from './image-cropper.styles.js';

export interface CropResult {
  blob: Blob | null;
  dataUrl: string;
  rect: {
    zoom: number;
    offsetX: number;
    offsetY: number;
    aspectRatio: number;
  };
}

function isSafeImageSrc(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return '';
  if (trimmed.startsWith('/') || trimmed.startsWith('./') || trimmed.startsWith('../')) {
    return trimmed;
  }
  const lower = trimmed.toLowerCase();
  if (
    lower.startsWith('https://') ||
    lower.startsWith('http://') ||
    lower.startsWith('blob:') ||
    /^data:image\/(png|jpeg|jpg|webp|gif|svg\+xml)[;,]/i.test(trimmed)
  ) {
    return trimmed;
  }
  return '';
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/**
 * Accessible image cropper with keyboard pan/zoom, safe <img> SVG rendering, and canvas crop export.
 */
export class MthImageCropper extends UIElement {
  static override shadowRootOptions: ShadowRootInit = {
    mode: 'open',
    delegatesFocus: true,
  };

  static override styles = imageCropperStyles;
  static override messages = imageCropperMessages;

  @property({ type: String })
  src = '';

  @property({ type: String })
  alt = '';

  @property({ type: Number, attribute: 'aspect-ratio' })
  aspectRatio = 1;

  @property({ type: Number })
  zoom = 1;

  @property({ type: Number, attribute: 'offset-x' })
  offsetX = 0;

  @property({ type: Number, attribute: 'offset-y' })
  offsetY = 0;

  @property({ type: Boolean, reflect: true })
  disabled = false;

  @query('[part="image"]')
  private imageEl!: HTMLImageElement | null;

  private dynamicSheet: CSSStyleSheet | null = null;
  private dragPointerId: number | null = null;
  private dragStartX = 0;
  private dragStartY = 0;
  private dragBaseX = 0;
  private dragBaseY = 0;

  protected override updated(changed: PropertyValues<this>): void {
    super.updated(changed);
    if (changed.has('disabled')) {
      this.setCustomState('disabled', this.disabled);
    }
    if (
      changed.has('zoom') ||
      changed.has('offsetX') ||
      changed.has('offsetY') ||
      changed.has('aspectRatio')
    ) {
      this.syncTransformSheet();
    }
  }

  protected override onFirstConnect(): void {
    this.syncTransformSheet();
  }

  reset(): void {
    if (this.disabled) return;
    this.zoom = 1;
    this.offsetX = 0;
    this.offsetY = 0;
    this.emitChange();
  }

  async crop(mimeType = 'image/png', quality = 0.92): Promise<CropResult> {
    const rect = {
      zoom: this.zoom,
      offsetX: this.offsetX,
      offsetY: this.offsetY,
      aspectRatio: this.aspectRatio,
    };
    let dataUrl = '';
    let blob: Blob | null = null;

    if (typeof document !== 'undefined' && this.imageEl) {
      try {
        const canvas = document.createElement('canvas');
        const width = this.imageEl.naturalWidth || 200;
        const height =
          this.aspectRatio > 0 ? Math.round(width / this.aspectRatio) : this.imageEl.naturalHeight || 200;
        canvas.width = Math.max(1, width);
        canvas.height = Math.max(1, height);
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.save();
          ctx.translate(
            canvas.width / 2 + (this.offsetX / 100) * canvas.width,
            canvas.height / 2 + (this.offsetY / 100) * canvas.height,
          );
          ctx.scale(this.zoom, this.zoom);
          ctx.drawImage(this.imageEl, -canvas.width / 2, -canvas.height / 2, canvas.width, canvas.height);
          ctx.restore();
          dataUrl = canvas.toDataURL(mimeType, quality);
          blob = await new Promise<Blob | null>((resolve) => {
            if (typeof canvas.toBlob === 'function') {
              let settled = false;
              const timer = setTimeout(() => {
                if (!settled) {
                  settled = true;
                  resolve(null);
                }
              }, 20);
              canvas.toBlob(
                (b) => {
                  if (!settled) {
                    settled = true;
                    clearTimeout(timer);
                    resolve(b);
                  }
                },
                mimeType,
                quality,
              );
            } else {
              resolve(null);
            }
          });
        }
      } catch {
        // Minimal DOM environments without canvas 2d return empty dataUrl/blob gracefully.
      }
    }

    this.emitEvent('mth-crop', {
      detail: { ...rect, dataUrl },
    });
    return { blob, dataUrl, rect };
  }

  private syncTransformSheet(): void {
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
    const aspectRule = this.aspectRatio > 0 ? `aspect-ratio: ${this.aspectRatio};` : '';
    this.dynamicSheet.replaceSync(
      `[part="image"] { transform: translate3d(${this.offsetX}%, ${this.offsetY}%, 0) scale(${this.zoom}); }\n` +
        `[part="frame"] { ${aspectRule} }`,
    );
  }

  private emitChange(): void {
    this.syncTransformSheet();
    this.emitEvent('mth-change', {
      detail: {
        zoom: this.zoom,
        offsetX: this.offsetX,
        offsetY: this.offsetY,
      },
    });
  }

  private readonly handleKeyDown = (event: KeyboardEvent): void => {
    if (this.disabled) return;
    const step = event.shiftKey ? 5 : 1;
    let handled = true;
    switch (event.key) {
      case 'ArrowLeft':
        this.offsetX = clamp(this.offsetX - step, -50, 50);
        break;
      case 'ArrowRight':
        this.offsetX = clamp(this.offsetX + step, -50, 50);
        break;
      case 'ArrowUp':
        this.offsetY = clamp(this.offsetY - step, -50, 50);
        break;
      case 'ArrowDown':
        this.offsetY = clamp(this.offsetY + step, -50, 50);
        break;
      case '+':
      case '=':
        this.zoom = clamp(Number((this.zoom + 0.1).toFixed(2)), 1, 3);
        break;
      case '-':
      case '_':
        this.zoom = clamp(Number((this.zoom - 0.1).toFixed(2)), 1, 3);
        break;
      default:
        handled = false;
    }
    if (handled) {
      event.preventDefault();
      this.emitChange();
    }
  };

  private readonly handlePointerDown = (event: PointerEvent): void => {
    if (this.disabled) return;
    const target = event.currentTarget as HTMLElement;
    this.dragPointerId = event.pointerId;
    this.dragStartX = event.clientX;
    this.dragStartY = event.clientY;
    this.dragBaseX = this.offsetX;
    this.dragBaseY = this.offsetY;
    target.setPointerCapture?.(event.pointerId);
  };

  private readonly handlePointerMove = (event: PointerEvent): void => {
    if (this.disabled || this.dragPointerId !== event.pointerId) return;
    const dx = Math.round((event.clientX - this.dragStartX) / 3);
    const dy = Math.round((event.clientY - this.dragStartY) / 3);
    this.offsetX = clamp(this.dragBaseX + dx, -50, 50);
    this.offsetY = clamp(this.dragBaseY + dy, -50, 50);
    this.emitChange();
  };

  private readonly handlePointerUp = (event: PointerEvent): void => {
    if (this.dragPointerId === event.pointerId) {
      this.dragPointerId = null;
    }
  };

  protected override render() {
    const safeSrc = isSafeImageSrc(this.src);
    return html`
      <div part="base" class="base">
        <div
          part="viewport"
          class="viewport"
          role="region"
          tabindex=${this.disabled ? '-1' : '0'}
          aria-label=${this.t('viewportLabel')}
          @keydown=${this.handleKeyDown}
          @pointerdown=${this.handlePointerDown}
          @pointermove=${this.handlePointerMove}
          @pointerup=${this.handlePointerUp}
          @pointercancel=${this.handlePointerUp}
        >
          ${safeSrc
            ? html`<img part="image" class="image" src=${safeSrc} alt=${this.alt} draggable="false" />`
            : nothing}
          <div part="frame" class="frame" aria-hidden="true"></div>
        </div>
        <div part="controls" class="controls">
          <label class="slider-row">
            <span>${this.t('zoomLabel')}</span>
            <input
              type="range"
              min="1"
              max="3"
              step="0.1"
              .value=${String(this.zoom)}
              aria-label=${this.t('zoomLabel')}
              ?disabled=${this.disabled}
              @input=${(e: Event) => {
                this.zoom = Number.parseFloat((e.currentTarget as HTMLInputElement).value);
                this.emitChange();
              }}
            />
          </label>
          <label class="slider-row">
            <span>${this.t('panXLabel')}</span>
            <input
              type="range"
              min="-50"
              max="50"
              step="1"
              .value=${String(this.offsetX)}
              aria-label=${this.t('panXLabel')}
              ?disabled=${this.disabled}
              @input=${(e: Event) => {
                this.offsetX = Number.parseInt((e.currentTarget as HTMLInputElement).value, 10);
                this.emitChange();
              }}
            />
          </label>
          <label class="slider-row">
            <span>${this.t('panYLabel')}</span>
            <input
              type="range"
              min="-50"
              max="50"
              step="1"
              .value=${String(this.offsetY)}
              aria-label=${this.t('panYLabel')}
              ?disabled=${this.disabled}
              @input=${(e: Event) => {
                this.offsetY = Number.parseInt((e.currentTarget as HTMLInputElement).value, 10);
                this.emitChange();
              }}
            />
          </label>
          <div class="actions">
            <button
              type="button"
              part="reset-button"
              class="action-btn"
              ?disabled=${this.disabled}
              @click=${() => this.reset()}
            >
              ${this.t('resetAction')}
            </button>
            <button
              type="button"
              part="crop-button"
              class="action-btn"
              ?disabled=${this.disabled}
              @click=${() => void this.crop()}
            >
              ${this.t('cropAction')}
            </button>
          </div>
        </div>
      </div>
    `;
  }
}
