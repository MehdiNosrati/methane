import { registerMthPriceDisplay } from './element.js';

export * from './element.js';

registerMthPriceDisplay();

declare global {
  interface HTMLElementTagNameMap {
    'mth-price-display': import('./price-display.js').MthPriceDisplay;
  }
}
