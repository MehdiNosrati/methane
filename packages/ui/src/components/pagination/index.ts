import { registerMthPagination } from './element.js';

export * from './element.js';

registerMthPagination();

declare global {
  interface HTMLElementTagNameMap {
    'mth-pagination': import('./pagination.js').MthPagination;
  }
}
