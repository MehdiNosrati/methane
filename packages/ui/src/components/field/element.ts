import { defineComponents } from '@methane-ui/core';
import { MthField } from './field.js';

export { MthField } from './field.js';
export { fieldMessages } from './field.messages.js';
export { fieldSpec } from './field.spec.js';
export { fieldStyles } from './field.styles.js';

export function registerMthField(prefix?: string): ReadonlyArray<string> {
  return defineComponents({
    ...(prefix !== undefined ? { prefix } : {}),
    components: { 'mth-field': MthField },
  });
}
