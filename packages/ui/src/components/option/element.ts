import { defineComponents } from '@methane/core';
import { MthOption } from './option.js';

export { MthOption } from './option.js';
export { optionSpec } from './option.spec.js';
export { optionStyles } from './option.styles.js';

export function registerMthOption(prefix?: string): ReadonlyArray<string> {
  return defineComponents({
    ...(prefix !== undefined ? { prefix } : {}),
    components: { 'mth-option': MthOption },
  });
}
