import { defineComponents } from '@methane-ui/core';
import { MthTimezonePicker } from './timezone-picker.js';

export { MthTimezonePicker } from './timezone-picker.js';
export { timezonePickerMessages } from './timezone-picker.messages.js';
export { timezonePickerStyles } from './timezone-picker.styles.js';

export function registerMthTimezonePicker(prefix?: string): ReadonlyArray<string> {
  return defineComponents({
    ...(prefix !== undefined ? { prefix } : {}),
    components: { 'mth-timezone-picker': MthTimezonePicker },
  });
}
