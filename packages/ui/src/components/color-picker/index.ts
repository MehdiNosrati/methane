import { registerMthColorPicker } from './element.js';

export * from './element.js';

registerMthColorPicker();

declare global {
  interface HTMLElementTagNameMap {
    'mth-color-picker': import('./color-picker.js').MthColorPicker;
  }
}
