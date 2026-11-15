import { registerMthAddressInput } from './element.js';

export * from './element.js';

registerMthAddressInput();

declare global {
  interface HTMLElementTagNameMap {
    'mth-address-input': import('./address-input.js').MthAddressInput;
  }
}
