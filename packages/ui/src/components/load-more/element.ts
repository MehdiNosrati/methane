import { defineComponents } from '@methane-ui/core';
import { MthLoadMore } from './load-more.js';

export { MthLoadMore } from './load-more.js';
export { loadMoreMessages } from './load-more.messages.js';
export { loadMoreSpec } from './load-more.spec.js';
export { loadMoreStyles } from './load-more.styles.js';

export function registerMthLoadMore(prefix?: string): ReadonlyArray<string> {
  return defineComponents({
    ...(prefix !== undefined ? { prefix } : {}),
    components: { 'mth-load-more': MthLoadMore },
  });
}

declare global {
  interface HTMLElementTagNameMap {
    'mth-load-more': MthLoadMore;
  }
}
