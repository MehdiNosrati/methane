import { defineComponents } from '@methane-ui/core';
import { MthFacetFilters } from './facet-filters.js';

export { MthFacetFilters, type FacetGroup, type FacetOption, type FacetRangeValue } from './facet-filters.js';
export { facetFiltersMessages } from './facet-filters.messages.js';

export function registerMthFacetFilters(prefix?: string): ReadonlyArray<string> {
  return defineComponents({
    ...(prefix !== undefined ? { prefix } : {}),
    components: { 'mth-facet-filters': MthFacetFilters },
  });
}
