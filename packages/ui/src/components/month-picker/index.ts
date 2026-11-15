import { registerMthMonthPicker } from './element.js';

export * from './element.js';

registerMthMonthPicker();

declare global {
  interface HTMLElementTagNameMap {
    'mth-month-picker': import('./month-picker.js').MthMonthPicker;
  }
}
