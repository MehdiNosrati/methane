import { defineComponents } from '@methane-ui/core';
import { MthDatetimePicker } from './datetime-picker.js';

export { MthDatetimePicker } from './datetime-picker.js';
export { datetimePickerMessages } from './datetime-picker.messages.js';
export { datetimePickerStyles } from './datetime-picker.styles.js';

export function registerMthDatetimePicker(prefix?: string): ReadonlyArray<string> {
  return defineComponents({
    ...(prefix !== undefined ? { prefix } : {}),
    components: { 'mth-datetime-picker': MthDatetimePicker },
  });
}
