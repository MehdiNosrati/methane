import { defineComponents } from '@methane-ui/core';
import { MthKeyValue } from './key-value.js';

export { MthKeyValue, type MthKeyValueOrientation } from './key-value.js';
export { keyValueMessages } from './key-value.messages.js';
export { keyValueSpec } from './key-value.spec.js';
export { keyValueStyles } from './key-value.styles.js';

export function registerMthKeyValue(prefix?: string): ReadonlyArray<string> {
  return defineComponents({
    ...(prefix !== undefined ? { prefix } : {}),
    components: { 'mth-key-value': MthKeyValue },
  });
}
