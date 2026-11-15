import { registerMthDatePicker } from './element.js';

export * from './element.js';

registerMthDatePicker();

declare global {
  interface HTMLElementTagNameMap {
    'mth-date-picker': import('./date-picker.js').MthDatePicker;
  }
}
