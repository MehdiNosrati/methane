import { registerMthInfiniteScroll } from './element.js';

export * from './element.js';

registerMthInfiniteScroll();

declare global {
  interface HTMLElementTagNameMap {
    'mth-infinite-scroll': import('./infinite-scroll.js').MthInfiniteScroll;
  }
}
