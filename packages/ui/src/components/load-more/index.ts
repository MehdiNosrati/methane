import { registerMthLoadMore } from './element.js';

export * from './element.js';

registerMthLoadMore();

declare global {
  interface HTMLElementTagNameMap {
    'mth-load-more': import('./load-more.js').MthLoadMore;
  }
}
