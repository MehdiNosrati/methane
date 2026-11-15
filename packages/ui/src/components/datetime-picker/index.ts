import { registerMthDatetimePicker } from './element.js';

export * from './element.js';

registerMthDatetimePicker();

declare global {
  interface HTMLElementTagNameMap {
    'mth-datetime-picker': import('./datetime-picker.js').MthDatetimePicker;
  }
}
