import { registerMthCreditCardInput } from './element.js';

export * from './element.js';

registerMthCreditCardInput();

declare global {
  interface HTMLElementTagNameMap {
    'mth-credit-card-input': import('./credit-card-input.js').MthCreditCardInput;
  }
}
