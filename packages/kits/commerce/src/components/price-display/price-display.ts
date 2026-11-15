import { UIElement, type PropertyValues } from '@methane-ui/core';
import { registerMthBadge } from '@methane-ui/ui/badge';
import { html, nothing } from 'lit';
import { property } from 'lit/decorators.js';
import { priceDisplayMessages } from './price-display.messages.js';
import { priceDisplayStyles } from './price-display.styles.js';

/**
 * `<mth-price-display>`: locale-aware `Intl.NumberFormat` currency formatter with
 * compare-at strikethrough pricing and accessible discount badge.
 */
export class MthPriceDisplay extends UIElement {
  static override messages = priceDisplayMessages;
  static override styles = priceDisplayStyles;

  @property({ type: Number })
  amount = 0;

  @property({ type: Number, attribute: 'compare-at-amount' })
  compareAtAmount: number | null = null;

  @property({ type: String, reflect: true })
  currency = 'USD';

  @property({ type: String })
  locale = '';

  @property({ type: String })
  period = '';

  @property({ type: Boolean, attribute: 'show-discount-badge' })
  showDiscountBadge = true;

  constructor() {
    super();
    registerMthBadge();
  }

  get isOnSale(): boolean {
    return (
      typeof this.compareAtAmount === 'number' &&
      Number.isFinite(this.compareAtAmount) &&
      this.compareAtAmount > this.amount
    );
  }

  get discountPercent(): number {
    if (!this.isOnSale || !this.compareAtAmount || this.compareAtAmount <= 0) return 0;
    return Math.round(((this.compareAtAmount - this.amount) / this.compareAtAmount) * 100);
  }

  formatCurrency(value: number): string {
    const targetLocale = this.locale || this.resolvedLocale;
    const safeAmount = Number.isFinite(value) ? value : 0;
    try {
      return new Intl.NumberFormat(targetLocale, {
        style: 'currency',
        currency: this.currency || 'USD',
      }).format(safeAmount);
    } catch {
      return `${this.currency || 'USD'} ${safeAmount.toFixed(2)}`;
    }
  }

  protected override willUpdate(changed: PropertyValues): void {
    super.willUpdate(changed);
    this.setCustomState('on-sale', this.isOnSale);
    this.setCustomState('free', this.amount === 0);
  }

  protected override render() {
    const formattedCurrent = this.formatCurrency(this.amount);
    const compareValue = this.isOnSale ? this.compareAtAmount! : null;
    const formattedCompare = compareValue !== null ? this.formatCurrency(compareValue) : '';
    const pct = this.discountPercent;

    return html`
      <span class="root" part="base" dir=${this.resolvedDir}>
        <span class="current" part="current">${formattedCurrent}</span>
        ${this.period
          ? html`<span class="period" part="period"><slot name="period">${this.period}</slot></span>`
          : html`<slot name="period"></slot>`}
        ${compareValue !== null
          ? html`
              <span class="compare-at" part="compare-at">
                <span class="sr-only">${this.t('wasPrice', { price: formattedCompare })}</span>
                <span aria-hidden="true">${formattedCompare}</span>
              </span>
            `
          : nothing}
        ${this.showDiscountBadge && pct > 0
          ? html`<mth-badge part="discount" variant="success" size="sm" pill>
              ${this.t('savePercent', { percent: pct })}
            </mth-badge>`
          : nothing}
      </span>
    `;
  }
}
