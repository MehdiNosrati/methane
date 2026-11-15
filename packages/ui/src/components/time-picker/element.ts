import { defineComponents } from '@methane-ui/core';
import { MthTimePicker } from './time-picker.js';

export { MthTimePicker } from './time-picker.js';
export { timePickerMessages } from './time-picker.messages.js';
export { timePickerSpec } from './time-picker.spec.js';
export { timePickerStyles } from './time-picker.styles.js';

export function registerMthTimePicker(prefix?: string): ReadonlyArray<string> {
  return defineComponents({
    ...(prefix !== undefined ? { prefix } : {}),
    components: { 'mth-time-picker': MthTimePicker },
  });
}
