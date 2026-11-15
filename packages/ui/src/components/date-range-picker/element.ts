import { defineComponents } from '@methane-ui/core';
import { MthDateRangePicker } from './date-range-picker.js';

export { MthDateRangePicker } from './date-range-picker.js';
export { dateRangePickerMessages } from './date-range-picker.messages.js';
export { dateRangePickerStyles } from './date-range-picker.styles.js';

export function registerMthDateRangePicker(prefix?: string): ReadonlyArray<string> {
  return defineComponents({
    ...(prefix !== undefined ? { prefix } : {}),
    components: { 'mth-date-range-picker': MthDateRangePicker },
  });
}
