import { registerMthQuantitySelector } from './element.js';

export * from './element.js';

registerMthQuantitySelector();

declare global {
  interface HTMLElementTagNameMap {
    'mth-quantity-selector': import('./quantity-selector.js').MthQuantitySelector;
  }
}
