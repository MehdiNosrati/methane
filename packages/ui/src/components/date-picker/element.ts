import { defineComponents } from '@methane/core';
import { MthDatePicker } from './date-picker.js';

export { MthDatePicker } from './date-picker.js';
export { datePickerMessages } from './date-picker.messages.js';
export { datePickerSpec } from './date-picker.spec.js';
export { datePickerStyles } from './date-picker.styles.js';

export function registerMthDatePicker(prefix?: string): ReadonlyArray<string> {
  return defineComponents({
    ...(prefix !== undefined ? { prefix } : {}),
    components: { 'mth-date-picker': MthDatePicker },
  });
}
