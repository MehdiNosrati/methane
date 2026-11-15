import { defineComponents } from '@methane/core';
import { MthAsyncSearch } from './async-search.js';

export { MthAsyncSearch, type AsyncSearchOption } from './async-search.js';
export { asyncSearchMessages, type AsyncSearchMessages } from './async-search.messages.js';
export { asyncSearchSpec } from './async-search.spec.js';
export { asyncSearchStyles } from './async-search.styles.js';

export function registerMthAsyncSearch(prefix?: string): ReadonlyArray<string> {
  return defineComponents({
    ...(prefix !== undefined ? { prefix } : {}),
    components: { 'mth-async-search': MthAsyncSearch },
  });
}
