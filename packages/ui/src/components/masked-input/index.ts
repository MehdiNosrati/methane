import { registerMthMaskedInput } from './element.js';

export * from './element.js';

registerMthMaskedInput();

declare global {
  interface HTMLElementTagNameMap {
    'mth-masked-input': import('./masked-input.js').MthMaskedInput;
  }
}
