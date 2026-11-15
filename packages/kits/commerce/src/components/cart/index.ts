import { registerMthCart } from './element.js';

export * from './element.js';

registerMthCart();

declare global {
  interface HTMLElementTagNameMap {
    'mth-cart': import('./cart.js').MthCart;
  }
}
