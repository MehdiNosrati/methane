import { defineComponents } from '@methane-ui/core';
import { MthMonthPicker } from './month-picker.js';

export { MthMonthPicker } from './month-picker.js';
export { monthPickerMessages } from './month-picker.messages.js';
export { monthPickerStyles } from './month-picker.styles.js';

export function registerMthMonthPicker(prefix?: string): ReadonlyArray<string> {
  return defineComponents({
    ...(prefix !== undefined ? { prefix } : {}),
    components: { 'mth-month-picker': MthMonthPicker },
  });
}
