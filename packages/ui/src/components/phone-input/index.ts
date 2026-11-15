import { registerMthPhoneInput } from './element.js';

export * from './element.js';

registerMthPhoneInput();

declare global {
  interface HTMLElementTagNameMap {
    'mth-phone-input': import('./phone-input.js').MthPhoneInput;
  }
}
