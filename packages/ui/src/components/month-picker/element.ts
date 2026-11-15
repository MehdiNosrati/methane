import { defineComponents } from '@methane/core';
import { MthMonthPicker } from './month-picker.js';

export { MthMonthPicker } from './month-picker.js';
export { monthPickerMessages } from './month-picker.messages.js';
export { monthPickerSpec } from './month-picker.spec.js';
export { monthPickerStyles } from './month-picker.styles.js';

export function registerMthMonthPicker(prefix?: string): ReadonlyArray<string> {
  return defineComponents({
    ...(prefix !== undefined ? { prefix } : {}),
    components: { 'mth-month-picker': MthMonthPicker },
  });
}
