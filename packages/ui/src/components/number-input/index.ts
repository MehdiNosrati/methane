import { registerMthNumberInput } from './element.js';

export * from './element.js';

registerMthNumberInput();

declare global {
  interface HTMLElementTagNameMap {
    'mth-number-input': import('./number-input.js').MthNumberInput;
  }
}
