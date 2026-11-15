import { registerMthFacetFilters } from './element.js';

export * from './element.js';

registerMthFacetFilters();

declare global {
  interface HTMLElementTagNameMap {
    'mth-facet-filters': import('./facet-filters.js').MthFacetFilters;
  }
}
