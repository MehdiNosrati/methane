import { defineComponents } from '@methane/core';
import { MthCheckbox } from './checkbox.js';

export { MthCheckbox } from './checkbox.js';
export { checkboxMessages } from './checkbox.messages.js';
export { checkboxSpec } from './checkbox.spec.js';
export { checkboxStyles } from './checkbox.styles.js';

export function registerMthCheckbox(prefix?: string): ReadonlyArray<string> {
  return defineComponents({
    ...(prefix !== undefined ? { prefix } : {}),
    components: { 'mth-checkbox': MthCheckbox },
  });
}
