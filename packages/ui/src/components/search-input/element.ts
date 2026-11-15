import { defineComponents } from '@methane-ui/core';
import { MthSearchInput } from './search-input.js';

export { MthSearchInput } from './search-input.js';
export { searchInputMessages } from './search-input.messages.js';
export { searchInputStyles } from './search-input.styles.js';

export function registerMthSearchInput(prefix?: string): ReadonlyArray<string> {
  return defineComponents({
    ...(prefix !== undefined ? { prefix } : {}),
    components: { 'mth-search-input': MthSearchInput },
  });
}
