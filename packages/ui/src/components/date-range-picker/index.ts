import { registerMthDateRangePicker } from './element.js';

export * from './element.js';

registerMthDateRangePicker();

declare global {
  interface HTMLElementTagNameMap {
    'mth-date-range-picker': import('./date-range-picker.js').MthDateRangePicker;
  }
}
