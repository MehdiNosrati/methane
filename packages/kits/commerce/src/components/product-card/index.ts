import { registerMthProductCard } from './element.js';

export * from './element.js';

registerMthProductCard();

declare global {
  interface HTMLElementTagNameMap {
    'mth-product-card': import('./product-card.js').MthProductCard;
  }
}
