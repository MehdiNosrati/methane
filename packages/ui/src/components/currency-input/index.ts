import { registerMthCurrencyInput } from './element.js';

export * from './element.js';

registerMthCurrencyInput();

declare global {
  interface HTMLElementTagNameMap {
    'mth-currency-input': import('./currency-input.js').MthCurrencyInput;
  }
}
