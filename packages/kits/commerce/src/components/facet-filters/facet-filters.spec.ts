import type { ComponentBehaviorSpec } from '@methane-ui/spec-compiler';
import { facetFiltersMessages } from './facet-filters.messages.js';

export const facetFiltersSpec: ComponentBehaviorSpec = {
  tag: 'mth-facet-filters',
  package: '@methane-ui/commerce',
  conformance: [],
  controllers: [],
  focusModel: 'none',
  states: ['has-active-filters'],
  keyboard: [],
  props: [
    { name: 'facets', attr: false, type: 'ReadonlyArray<FacetGroup>' },
    { name: 'selected', attr: false, type: 'Record<string, ReadonlyArray<string>>' },
    { name: 'ranges', attr: false, type: 'Record<string, FacetRangeValue>' },
    { name: 'collapsible', attr: 'collapsible', type: 'boolean', default: true },
    { name: 'label', attr: 'label', type: 'string', default: '' },
  ],
  events: [
    {
      name: 'mth-filter-change',
      cancelable: false,
      detailType:
        '{ groupId: string; selected: Record<string, ReadonlyArray<string>>; ranges: Record<string, FacetRangeValue> }',
    },
    {
      name: 'mth-filter-clear',
      cancelable: false,
      detailType: '{}',
    },
  ],
  slots: [],
  parts: [
    { name: 'base', description: 'Outer filters form/aside container.' },
    { name: 'clear-button', description: 'Clear all active filters button.' },
    { name: 'group', description: 'Individual facet group.' },
    { name: 'group-toggle', description: 'Collapsible group header button.' },
    { name: 'swatch', description: 'Color swatch button.' },
  ],
  messages: { ...facetFiltersMessages },
};

export const CEM_METADATA = {
  description:
    'Collapsible faceted product filter sidebar supporting checkbox lists, CSP-safe adopted-stylesheet color swatches, and numeric range bounds.',
  propDescriptions: {
    facets: 'Array of FacetGroup definitions (checkbox, swatch, or range).',
    selected: 'Map of facet group ID to selected option values.',
    ranges: 'Map of range facet group ID to min/max bounds.',
    collapsible: 'Allows facet groups to toggle expanded/collapsed state.',
    label: 'Accessible region label overriding localized default.',
  },
  cssProperties: [
    { name: '--mth-color-surface', description: 'Filter panel background surface.' },
    { name: '--mth-color-border', description: 'Group divider border color.' },
    { name: '--mth-color-accent', description: 'Active swatch ring and badge accent.' },
  ],
};
