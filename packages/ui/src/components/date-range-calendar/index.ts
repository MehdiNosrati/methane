import { registerMthDateRangeCalendar } from './element.js';

export * from './element.js';

registerMthDateRangeCalendar();

declare global {
  interface HTMLElementTagNameMap {
    'mth-date-range-calendar': import('./date-range-calendar.js').MthDateRangeCalendar;
  }
}
