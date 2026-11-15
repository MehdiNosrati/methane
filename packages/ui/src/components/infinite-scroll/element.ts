import { defineComponents } from '@methane-ui/core';
import { MthInfiniteScroll } from './infinite-scroll.js';

export { MthInfiniteScroll } from './infinite-scroll.js';
export { infiniteScrollMessages } from './infinite-scroll.messages.js';
export { infiniteScrollSpec } from './infinite-scroll.spec.js';
export { infiniteScrollStyles } from './infinite-scroll.styles.js';

export function registerMthInfiniteScroll(prefix?: string): ReadonlyArray<string> {
  return defineComponents({
    ...(prefix !== undefined ? { prefix } : {}),
    components: { 'mth-infinite-scroll': MthInfiniteScroll },
  });
}
