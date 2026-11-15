import { defineComponents } from '@methane-ui/core';
import { MthSelect } from './select.js';

export { MthSelect, supportsCustomizableSelect, type SelectOption } from './select.js';
export { selectMessages } from './select.messages.js';
export { selectStyles } from './select.styles.js';

export function registerMthSelect(prefix?: string): ReadonlyArray<string> {
  return defineComponents({
    ...(prefix !== undefined ? { prefix } : {}),
    components: { 'mth-select': MthSelect },
  });
}
