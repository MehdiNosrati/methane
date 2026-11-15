import { defineComponents } from '@methane/core';
import { MthPagination } from './pagination.js';

export { computePaginationRange, MthPagination, type PaginationToken } from './pagination.js';
export { paginationMessages } from './pagination.messages.js';
export { paginationSpec } from './pagination.spec.js';
export { paginationStyles } from './pagination.styles.js';

export function registerMthPagination(prefix?: string): ReadonlyArray<string> {
  return defineComponents({
    ...(prefix !== undefined ? { prefix } : {}),
    components: { 'mth-pagination': MthPagination },
  });
}
