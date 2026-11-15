import { defineComponents } from '@methane-ui/core';
import { MthOptionGroup } from './option-group.js';

export { MthOptionGroup } from './option-group.js';
export { optionGroupStyles } from './option-group.styles.js';

export function registerMthOptionGroup(prefix?: string): ReadonlyArray<string> {
  return defineComponents({
    ...(prefix !== undefined ? { prefix } : {}),
    components: { 'mth-option-group': MthOptionGroup },
  });
}
