import { defineComponents } from '@methane-ui/core';
import { MthColorPicker } from './color-picker.js';

export { MthColorPicker } from './color-picker.js';
export { colorPickerMessages } from './color-picker.messages.js';
export { colorPickerSpec } from './color-picker.spec.js';
export { colorPickerStyles } from './color-picker.styles.js';

export function registerMthColorPicker(prefix?: string): ReadonlyArray<string> {
  return defineComponents({
    ...(prefix !== undefined ? { prefix } : {}),
    components: { 'mth-color-picker': MthColorPicker },
  });
}
