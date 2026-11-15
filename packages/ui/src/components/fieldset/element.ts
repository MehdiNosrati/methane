import { defineComponents } from '@methane/core';
import { MthFieldset } from './fieldset.js';

export { MthFieldset } from './fieldset.js';
export { fieldsetMessages } from './fieldset.messages.js';
export { fieldsetSpec } from './fieldset.spec.js';
export { fieldsetStyles } from './fieldset.styles.js';

export function registerMthFieldset(prefix?: string): ReadonlyArray<string> {
  return defineComponents({
    ...(prefix !== undefined ? { prefix } : {}),
    components: { 'mth-fieldset': MthFieldset },
  });
}
