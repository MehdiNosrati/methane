import { registerMthIbanInput } from './element.js';

export * from './element.js';

registerMthIbanInput();

declare global {
  interface HTMLElementTagNameMap {
    'mth-iban-input': import('./iban-input.js').MthIbanInput;
  }
}
