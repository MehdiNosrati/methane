import { defineComponents } from '@methane-ui/core';
import { MthMultiSelect } from './multi-select.js';

export { MthMultiSelect, type MultiSelectOption } from './multi-select.js';
export { multiSelectMessages, type MultiSelectMessages } from './multi-select.messages.js';
export { multiSelectStyles } from './multi-select.styles.js';

export function registerMthMultiSelect(prefix?: string): ReadonlyArray<string> {
  return defineComponents({
    ...(prefix !== undefined ? { prefix } : {}),
    components: { 'mth-multi-select': MthMultiSelect },
  });
}
