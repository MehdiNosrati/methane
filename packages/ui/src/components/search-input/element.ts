import { defineComponents } from '@methane/core';
import { MthSearchInput } from './search-input.js';

export { MthSearchInput } from './search-input.js';
export { searchInputMessages } from './search-input.messages.js';
export { searchInputSpec } from './search-input.spec.js';
export { searchInputStyles } from './search-input.styles.js';

export function registerMthSearchInput(prefix?: string): ReadonlyArray<string> {
  return defineComponents({
    ...(prefix !== undefined ? { prefix } : {}),
    components: { 'mth-search-input': MthSearchInput },
  });
}
