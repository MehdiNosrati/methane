import { UIElement, type PropertyValues } from '@methane-ui/core';
import { html } from 'lit';
import { property } from 'lit/decorators.js';
import { reviewSummaryMessages } from './review-summary.messages.js';
import { reviewSummaryStyles } from './review-summary.styles.js';

/**
 * `<mth-review-summary>`: aggregate product review summary with CSSStyleSheet-driven
 * percentage distribution bars and interactive star filter toggles.
 */
export class MthReviewSummary extends UIElement {
  static override messages = reviewSummaryMessages;
  static override styles = reviewSummaryStyles;

  @property({ type: Number })
  average = 0;

  @property({ type: Number, attribute: 'total-reviews' })
  totalReviews = 0;

  @property({ attribute: false })
  breakdown: Record<number, number> = {};

  @property({ type: Number, attribute: 'active-star' })
  activeStar: number | null = null;

  @property({ type: Number, attribute: 'max-stars' })
  maxStars = 5;

  @property({ type: String })
  label = '';

  private barSheet: CSSStyleSheet | null = null;

  private get safeMaxStars(): number {
    return Number.isFinite(this.maxStars) && this.maxStars >= 1 ? Math.min(10, Math.round(this.maxStars)) : 5;
  }

  private get computedTotal(): number {
    if (Number.isFinite(this.totalReviews) && this.totalReviews > 0) {
      return this.totalReviews;
    }
    let sum = 0;
    for (let star = 1; star <= this.safeMaxStars; star++) {
      const count = this.breakdown?.[star] ?? 0;
      if (Number.isFinite(count) && count > 0) sum += count;
    }
    return sum;
  }

  override connectedCallback(): void {
    super.connectedCallback();
    this.syncBarSheet();
  }

  protected override onMoveBefore(): void {
    super.onMoveBefore();
    this.syncBarSheet();
  }

  protected override willUpdate(changed: PropertyValues<this>): void {
    super.willUpdate(changed);
    this.setCustomState('filtered', typeof this.activeStar === 'number' && Number.isFinite(this.activeStar));
    this.setCustomState('empty', this.computedTotal === 0);
  }

  protected override updated(changed: PropertyValues<this>): void {
    super.updated(changed);
    if (changed.has('breakdown') || changed.has('totalReviews') || changed.has('maxStars')) {
      this.syncBarSheet();
    }
  }

  private syncBarSheet(): void {
    const root = this.shadowRoot;
    if (!root || !('adoptedStyleSheets' in root) || typeof CSSStyleSheet === 'undefined') {
      return;
    }
    const total = this.computedTotal;
    const rules: string[] = [];
    for (let star = 1; star <= this.safeMaxStars; star++) {
      const rawCount = this.breakdown?.[star] ?? 0;
      const count = Number.isFinite(rawCount) && rawCount > 0 ? rawCount : 0;
      const pct = total > 0 ? Math.min(100, Math.max(0, Math.round((count / total) * 100))) : 0;
      rules.push(`.fill[data-star="${star}"] { --_rs-pct: ${pct}%; }`);
    }
    if (!this.barSheet) {
      this.barSheet = new CSSStyleSheet();
    }
    if (typeof this.barSheet.replaceSync === 'function') {
      this.barSheet.replaceSync(rules.join('\n'));
      if (!root.adoptedStyleSheets.includes(this.barSheet)) {
        root.adoptedStyleSheets = [...root.adoptedStyleSheets, this.barSheet];
      }
    }
  }

  private toggleStar(star: number): void {
    const next = this.activeStar === star ? null : star;
    this.activeStar = next;
    this.emitEvent('mth-rating-filter', { detail: { star: next } });
  }

  protected override render() {
    const max = this.safeMaxStars;
    const safeAvg = Number.isFinite(this.average) ? Math.min(max, Math.max(0, this.average)) : 0;
    const total = this.computedTotal;
    const stars = Array.from({ length: max }, (_, idx) => max - idx);

    return html`
      <section class="root" part="base" dir=${this.resolvedDir} aria-label=${this.label || this.t('regionLabel')}>
        <div class="overview">
          <span class="score" part="score">${safeAvg.toFixed(1)}</span>
          <span class="stars" aria-label=${this.t('outOfLabel', { average: safeAvg.toFixed(1), max })}>
            ${'★'.repeat(Math.round(safeAvg))}${'☆'.repeat(Math.max(0, max - Math.round(safeAvg)))}
          </span>
          <span class="total" part="total">
            ${total > 0 ? this.t('totalReviewsLabel', { count: total }) : this.t('noReviewsLabel')}
          </span>
          <slot name="actions"></slot>
        </div>

        <div class="bars">
          ${stars.map((star) => {
            const count = Number.isFinite(this.breakdown?.[star]) ? Math.max(0, this.breakdown[star]!) : 0;
            const pressed = this.activeStar === star;
            return html`
              <button
                type="button"
                class="row"
                part="row"
                aria-pressed=${pressed ? 'true' : 'false'}
                @click=${() => this.toggleStar(star)}
              >
                <span>${this.t('starLabel', { star })}</span>
                <span class="track" part="bar">
                  <span class="fill" data-star=${String(star)}></span>
                </span>
                <span class="count">${count}</span>
              </button>
            `;
          })}
        </div>
      </section>
    `;
  }
}
