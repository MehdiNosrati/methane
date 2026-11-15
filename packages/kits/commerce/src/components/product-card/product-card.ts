import { UIElement, type PropertyValues } from '@methane/core';
import { isSafeUrl } from '@methane/sanitize';
import { registerMthBadge } from '@methane/ui/badge';
import { registerMthButton } from '@methane/ui/button';
import { html, nothing } from 'lit';
import { property } from 'lit/decorators.js';
import { productCardMessages } from './product-card.messages.js';
import { productCardStyles } from './product-card.styles.js';

/**
 * `<mth-product-card>`: e-commerce product tile with sanitized URL checks,
 * locale-aware currency formatting, accessible star summary, and quick-add action.
 */
export class MthProductCard extends UIElement {
  static override shadowRootOptions = { mode: 'open' as const, delegatesFocus: true };
  static override messages = productCardMessages;
  static override styles = productCardStyles;

  @property({ type: String })
  override title = '';

  @property({ type: String })
  subtitle = '';

  @property({ type: String, attribute: 'image-src' })
  imageSrc = '';

  @property({ type: String, attribute: 'image-alt' })
  imageAlt = '';

  @property({ type: String })
  href = '';

  @property({ type: Number })
  price: number | null = null;

  @property({ type: Number, attribute: 'compare-at-price' })
  compareAtPrice: number | null = null;

  @property({ type: String })
  currency = 'USD';

  @property({ type: String })
  locale = '';

  @property({ type: String })
  badge = '';

  @property({ type: Number })
  rating: number | null = null;

  @property({ type: Number, attribute: 'review-count' })
  reviewCount: number | null = null;

  @property({ type: Boolean, attribute: 'in-stock', reflect: true })
  inStock = true;

  @property({ type: String, attribute: 'action-label' })
  actionLabel = '';

  constructor() {
    super();
    registerMthBadge();
    registerMthButton();
  }

  private formatPrice(value: number): string {
    const targetLocale = this.locale || this.resolvedLocale;
    try {
      return new Intl.NumberFormat(targetLocale, {
        style: 'currency',
        currency: this.currency || 'USD',
      }).format(value);
    } catch {
      return `${this.currency || 'USD'} ${value.toFixed(2)}`;
    }
  }

  private renderStarsText(rating: number): string {
    const clamped = Math.max(0, Math.min(5, Math.round(rating)));
    return `${'★'.repeat(clamped)}${'☆'.repeat(5 - clamped)}`;
  }

  protected override willUpdate(changed: PropertyValues): void {
    super.willUpdate(changed);
    const onSale =
      typeof this.price === 'number' &&
      typeof this.compareAtPrice === 'number' &&
      this.compareAtPrice > this.price;
    this.setCustomState('out-of-stock', !this.inStock);
    this.setCustomState('on-sale', onSale);
  }

  private handleSelect(): void {
    const safeHref = this.href && isSafeUrl(this.href) ? this.href : '';
    this.emitEvent('mth-product-select', {
      detail: { title: this.title, href: safeHref },
    });
  }

  private handleAddToCart(): void {
    if (!this.inStock) return;
    this.emitEvent('mth-add-to-cart', {
      detail: {
        title: this.title,
        price: this.price,
        currency: this.currency,
      },
    });
  }

  protected override render() {
    const safeImage = this.imageSrc && isSafeUrl(this.imageSrc) ? this.imageSrc : '';
    const safeHref = this.href && isSafeUrl(this.href) ? this.href : '';
    const hasRating = typeof this.rating === 'number' && Number.isFinite(this.rating);
    const ratingVal = hasRating ? Math.max(0, Math.min(5, this.rating!)) : 0;
    const ratingAria = hasRating
      ? typeof this.reviewCount === 'number' && Number.isFinite(this.reviewCount)
        ? this.t('ratingSummary', { rating: ratingVal.toFixed(1), count: this.reviewCount })
        : this.t('ratingOnly', { rating: ratingVal.toFixed(1) })
      : '';
    const showBadge = this.badge || (!this.inStock ? this.t('outOfStock') : '');
    const ctaText = this.actionLabel || (this.inStock ? this.t('addToCart') : this.t('outOfStock'));

    return html`
      <article class="card" part="base" dir=${this.resolvedDir}>
        <div class="media" part="media">
          <slot name="media">
            ${safeImage
              ? html`<img class="image" part="image" src=${safeImage} alt=${this.imageAlt || this.title} loading="lazy" />`
              : html`<div class="placeholder">${this.t('noImage')}</div>`}
          </slot>
          ${showBadge
            ? html`<div class="badge-slot">
                <slot name="badge">
                  <mth-badge part="badge" variant=${this.inStock ? 'primary' : 'neutral'} size="sm" pill>
                    ${showBadge}
                  </mth-badge>
                </slot>
              </div>`
            : html`<div class="badge-slot"><slot name="badge"></slot></div>`}
        </div>

        <div class="body">
          <h3 class="title" part="title">
            ${safeHref
              ? html`<a class="title-link" href=${safeHref} @click=${this.handleSelect}>${this.title}</a>`
              : this.title}
          </h3>
          ${this.subtitle ? html`<p class="subtitle" part="subtitle">${this.subtitle}</p>` : nothing}
          ${hasRating
            ? html`
                <div class="rating" part="rating" aria-label=${ratingAria}>
                  <span class="stars" aria-hidden="true">${this.renderStarsText(ratingVal)}</span>
                  <span aria-hidden="true">${ratingVal.toFixed(1)}</span>
                  ${typeof this.reviewCount === 'number'
                    ? html`<span aria-hidden="true">(${this.reviewCount})</span>`
                    : nothing}
                </div>
              `
            : nothing}
          ${typeof this.price === 'number' && Number.isFinite(this.price)
            ? html`
                <div class="price-row" part="price">
                  <span class="current-price">${this.formatPrice(this.price)}</span>
                  ${typeof this.compareAtPrice === 'number' &&
                  Number.isFinite(this.compareAtPrice) &&
                  this.compareAtPrice > this.price
                    ? html`<s class="compare-price">${this.formatPrice(this.compareAtPrice)}</s>`
                    : nothing}
                </div>
              `
            : nothing}
        </div>

        <div class="footer">
          <mth-button
            part="action"
            variant="primary"
            ?disabled=${!this.inStock}
            @click=${this.handleAddToCart}
          >
            ${ctaText}
          </mth-button>
          <slot name="footer"></slot>
        </div>
      </article>
    `;
  }
}
