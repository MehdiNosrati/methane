import { defineComponents } from '@methane/core';
import { MthSelect } from './select.js';

export { MthSelect, supportsCustomizableSelect, type SelectOption } from './select.js';
export { selectMessages } from './select.messages.js';
export { selectSpec, CEM_METADATA } from './select.spec.js';
export { selectStyles } from './select.styles.js';

export function registerMthSelect(prefix?: string): ReadonlyArray<string> {
  return defineComponents({
    ...(prefix !== undefined ? { prefix } : {}),
    components: { 'mth-select': MthSelect },
  });
}
