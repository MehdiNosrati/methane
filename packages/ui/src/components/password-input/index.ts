import { registerMthPasswordInput } from './element.js';

export * from './element.js';

registerMthPasswordInput();

declare global {
  interface HTMLElementTagNameMap {
    'mth-password-input': import('./password-input.js').MthPasswordInput;
  }
}
