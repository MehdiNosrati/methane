import { UIElement, type PropertyValues } from '@methane/core';
import { html, nothing } from 'lit';
import { property, state } from 'lit/decorators.js';
import { zoomPanMessages } from './zoom-pan.messages.js';
import { zoomPanStyles } from './zoom-pan.styles.js';

export interface ZoomPanChangeDetail {
  readonly scale: number;
  readonly panX: number;
  readonly panY: number;
}

/**
 * `<mth-zoom-pan>`: zoom and pan viewport with toolbar controls, wheel zoom,
 * pointer panning, RTL-aware keyboard navigation, and adopted CSSStyleSheet transforms.
 */
export class MthZoomPan extends UIElement {
  static override shadowRootOptions = { mode: 'open' as const, delegatesFocus: true };
  static override messages = zoomPanMessages;
  static override styles = zoomPanStyles;

  @property({ type: Number, reflect: true })
  scale = 1;

  @property({ type: Number, attribute: 'min-scale' })
  minScale = 1;

  @property({ type: Number, attribute: 'max-scale' })
  maxScale = 4;

  @property({ type: Number })
  step = 0.25;

  @property({ type: Number, attribute: 'pan-x' })
  panX = 0;

  @property({ type: Number, attribute: 'pan-y' })
  panY = 0;

  @property({ type: String })
  label = '';

  @property({ type: Boolean, attribute: 'show-controls' })
  showControls = true;

  @state()
  private dragging = false;

  private lastPointerX = 0;
  private lastPointerY = 0;
  private transformSheet: CSSStyleSheet | null = null;

  override connectedCallback(): void {
    super.connectedCallback();
    this.syncTransformSheet();
    this.syncCustomStates();
  }

  protected override updated(changed: PropertyValues<this>): void {
    super.updated(changed);
    if (changed.has('scale') || changed.has('panX') || changed.has('panY')) {
      this.syncTransformSheet();
    }
    this.syncCustomStates();
  }

  zoomIn(): void {
    this.setTransform(this.scale + (this.step || 0.25), this.panX, this.panY);
  }

  zoomOut(): void {
    this.setTransform(this.scale - (this.step || 0.25), this.panX, this.panY);
  }

  reset(): void {
    this.setTransform(this.minScale || 1, 0, 0);
  }

  private syncCustomStates(): void {
    this.setCustomState('zoomed', this.scale > (this.minScale || 1));
  }

  private syncTransformSheet(): void {
    const root = this.shadowRoot;
    if (!root || !('adoptedStyleSheets' in root) || typeof CSSStyleSheet === 'undefined') {
      return;
    }
    if (!this.transformSheet) {
      this.transformSheet = new CSSStyleSheet();
    }
    if (typeof this.transformSheet.replaceSync === 'function') {
      this.transformSheet.replaceSync(
        `:host { --_zoom-scale: ${this.scale}; --_pan-x: ${this.panX}px; --_pan-y: ${this.panY}px; }`,
      );
      if (!root.adoptedStyleSheets.includes(this.transformSheet)) {
        root.adoptedStyleSheets = [...root.adoptedStyleSheets, this.transformSheet];
      }
    }
  }

  private setTransform(nextScale: number, nextX: number, nextY: number): void {
    const min = Number.isFinite(this.minScale) && this.minScale > 0 ? this.minScale : 1;
    const max = Number.isFinite(this.maxScale) && this.maxScale >= min ? this.maxScale : 4;
    const clampedScale = Math.round(Math.max(min, Math.min(max, nextScale)) * 100) / 100;
    const roundedX = clampedScale <= min ? 0 : Math.round(nextX);
    const roundedY = clampedScale <= min ? 0 : Math.round(nextY);

    if (clampedScale === this.scale && roundedX === this.panX && roundedY === this.panY) return;
    this.scale = clampedScale;
    this.panX = roundedX;
    this.panY = roundedY;
    this.syncTransformSheet();
    this.syncCustomStates();

    this.dispatchEvent(
      new CustomEvent<ZoomPanChangeDetail>('mth-change', {
        bubbles: true,
        composed: true,
        detail: { scale: this.scale, panX: this.panX, panY: this.panY },
      }),
    );
  }

  private handleWheel = (e: WheelEvent): void => {
    e.preventDefault();
    const delta = e.deltaY < 0 ? this.step || 0.25 : -(this.step || 0.25);
    this.setTransform(this.scale + delta, this.panX, this.panY);
  };

  private handlePointerDown = (e: PointerEvent): void => {
    this.dragging = true;
    this.lastPointerX = e.clientX;
    this.lastPointerY = e.clientY;
  };

  private handlePointerMove = (e: PointerEvent): void => {
    if (!this.dragging) return;
    const dx = e.clientX - this.lastPointerX;
    const dy = e.clientY - this.lastPointerY;
    this.lastPointerX = e.clientX;
    this.lastPointerY = e.clientY;
    this.setTransform(this.scale, this.panX + dx, this.panY + dy);
  };

  private handlePointerUp = (): void => {
    this.dragging = false;
  };

  private handleKeyDown = (e: KeyboardEvent): void => {
    const panStep = 24;
    const isRtl = typeof document !== 'undefined' && (this.dir === 'rtl' || document.documentElement.dir === 'rtl');
    if (e.key === '+' || e.key === '=') {
      e.preventDefault();
      this.zoomIn();
    } else if (e.key === '-') {
      e.preventDefault();
      this.zoomOut();
    } else if (e.key === '0') {
      e.preventDefault();
      this.reset();
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      this.setTransform(this.scale, this.panX + (isRtl ? panStep : -panStep), this.panY);
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      this.setTransform(this.scale, this.panX + (isRtl ? -panStep : panStep), this.panY);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      this.setTransform(this.scale, this.panX, this.panY - panStep);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      this.setTransform(this.scale, this.panX, this.panY + panStep);
    }
  };

  protected override render() {
    const min = this.minScale || 1;
    const max = this.maxScale || 4;
    const percent = Math.round(this.scale * 100);

    return html`
      <div
        class="base"
        part="base"
        role="region"
        aria-label=${this.label || zoomPanMessages.viewportLabel}
      >
        <div
          class="viewport"
          part="viewport"
          tabindex="0"
          role="application"
          aria-label=${this.label || zoomPanMessages.viewportLabel}
          data-dragging=${this.dragging ? 'true' : 'false'}
          @wheel=${this.handleWheel}
          @pointerdown=${this.handlePointerDown}
          @pointermove=${this.handlePointerMove}
          @pointerup=${this.handlePointerUp}
          @pointercancel=${this.handlePointerUp}
          @keydown=${this.handleKeyDown}
        >
          <div class="content" part="content">
            <slot></slot>
          </div>
        </div>

        ${this.showControls
          ? html`
              <div class="controls" part="controls">
                <button
                  type="button"
                  class="btn"
                  part="zoom-out"
                  aria-label=${zoomPanMessages.zoomOut}
                  ?disabled=${this.scale <= min}
                  @click=${() => this.zoomOut()}
                >
                  −
                </button>
                <button
                  type="button"
                  class="btn"
                  part="reset"
                  aria-label=${zoomPanMessages.reset}
                  @click=${() => this.reset()}
                >
                  ${`${percent}%`}
                </button>
                <button
                  type="button"
                  class="btn"
                  part="zoom-in"
                  aria-label=${zoomPanMessages.zoomIn}
                  ?disabled=${this.scale >= max}
                  @click=${() => this.zoomIn()}
                >
                  +
                </button>
              </div>
            `
          : nothing}
      </div>
    `;
  }
}
