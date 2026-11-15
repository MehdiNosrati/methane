import { UIElement, type PropertyValues } from '@methane/core';
import { html, nothing } from 'lit';
import { property } from 'lit/decorators.js';
import { progressRingMessages } from './progress-ring.messages.js';
import { progressRingStyles } from './progress-ring.styles.js';

/**
 * `<mth-progress-ring>`: SVG circular progress indicator with determinate
 * and indeterminate modes.
 */
export class MthProgressRing extends UIElement {
  static override messages = progressRingMessages;
  static override styles = progressRingStyles;

  @property({ type: Number })
  value = 0;

  @property({ type: Number })
  max = 100;

  @property({ type: Boolean, reflect: true })
  indeterminate = false;

  @property({ type: Number })
  size = 48;

  @property({ type: Number, attribute: 'stroke-width' })
  strokeWidth = 4;

  @property({ type: Boolean, attribute: 'show-value', reflect: true })
  showValue = false;

  @property({ type: String })
  label = '';

  private sizeSheet: CSSStyleSheet | null = null;
  private wasComplete = false;

  protected override firstUpdated(_changed: PropertyValues): void {
    super.firstUpdated(_changed);
    this.syncSizeSheet();
  }

  protected override willUpdate(changedProperties: PropertyValues): void {
    super.willUpdate(changedProperties);
    if (changedProperties.has('indeterminate')) {
      this.setCustomState('indeterminate', this.indeterminate);
    }
    const pct = this.computePercentage();
    const isComplete = !this.indeterminate && pct >= 100;
    this.setCustomState('complete', isComplete);
    if (isComplete && !this.wasComplete) {
      this.wasComplete = true;
      this.emitEvent('mth-complete', { detail: { value: this.value } });
    } else if (!isComplete) {
      this.wasComplete = false;
    }
  }

  protected override updated(changedProperties: PropertyValues): void {
    super.updated(changedProperties);
    if (changedProperties.has('size')) {
      this.syncSizeSheet();
    }
  }

  private computePercentage(): number {
    const safeMax = Number.isFinite(this.max) && this.max > 0 ? this.max : 100;
    const safeVal = Number.isFinite(this.value) ? Math.min(Math.max(0, this.value), safeMax) : 0;
    return Math.round((safeVal / safeMax) * 100);
  }

  private syncSizeSheet(): void {
    const root = this.shadowRoot;
    if (!root || typeof CSSStyleSheet === 'undefined' || !Array.isArray(root.adoptedStyleSheets)) {
      return;
    }
    if (!this.sizeSheet) {
      this.sizeSheet = new CSSStyleSheet();
      root.adoptedStyleSheets = [...root.adoptedStyleSheets, this.sizeSheet];
    }
    const safeSize = Number.isFinite(this.size) && this.size > 0 ? Math.round(this.size) : 48;
    this.sizeSheet.replaceSync(`:host { --_ring-size: ${safeSize}px; }`);
  }

  protected override render() {
    const safeStroke = Number.isFinite(this.strokeWidth) && this.strokeWidth > 0 ? this.strokeWidth : 4;
    const clampedStroke = Math.min(safeStroke, 12);
    const radius = 24 - clampedStroke / 2;
    const circumference = 2 * Math.PI * radius;
    const pct = this.computePercentage();
    const offset = this.indeterminate ? circumference * 0.72 : circumference * (1 - pct / 100);
    const ariaLabel = this.label || (this.indeterminate ? this.t('indeterminateLabel') : this.t('defaultLabel'));

    return html`
      <div
        class="base"
        part="base"
        role="progressbar"
        aria-label=${ariaLabel}
        aria-valuemin=${this.indeterminate ? nothing : '0'}
        aria-valuemax=${this.indeterminate ? nothing : String(this.max > 0 ? this.max : 100)}
        aria-valuenow=${this.indeterminate ? nothing : String(Math.min(Math.max(0, this.value), this.max > 0 ? this.max : 100))}
      >
        <svg part="svg" viewBox="0 0 48 48" aria-hidden="true">
          <circle
            class="track"
            part="track"
            cx="24"
            cy="24"
            r=${radius}
            stroke-width=${clampedStroke}
          ></circle>
          <circle
            class="indicator"
            part="indicator"
            cx="24"
            cy="24"
            r=${radius}
            stroke-width=${clampedStroke}
            stroke-dasharray=${circumference.toFixed(2)}
            stroke-dashoffset=${offset.toFixed(2)}
          ></circle>
        </svg>
        <span class="label" part="label">
          <slot>${this.showValue && !this.indeterminate ? `${pct}%` : nothing}</slot>
        </span>
      </div>
    `;
  }
}
