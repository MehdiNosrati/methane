import { getRuntime } from '@methane-ui/core';
import { MthFacetFilters } from './element.js';

export { MthFacetFilters, type FacetGroup, type FacetOption, type FacetRangeValue } from './element.js';
export { facetFiltersMessages } from './facet-filters.messages.js';
export { facetFiltersSpec } from './facet-filters.spec.js';

export function registerMthFacetFilters(prefix = 'mth'): ReadonlyArray<string> {
  return getRuntime().registry.defineComponents({
    prefix,
    components: {
      'mth-facet-filters': MthFacetFilters,
    },
  });
}

registerMthFacetFilters();
