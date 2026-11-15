import type { ComponentBehaviorSpec } from '@methane/spec-compiler';

export const comparisonTableSpec: ComponentBehaviorSpec = {
  tag: 'mth-comparison-table',
  package: '@methane/ui',
  conformance: [],
  controllers: [],
  focusModel: 'delegates-focus',
  states: ['sticky-header', 'compact'],
  keyboard: [
    {
      key: 'ArrowLeft / ArrowRight',
      when: 'Horizontal scroll wrapper is focused',
      expect: 'Scrolls overflowing comparison matrix horizontally',
    },
  ],
  props: [
    { name: 'caption', attr: 'caption', type: 'string', default: '' },
    { name: 'label', attr: 'label', type: 'string', default: '' },
    { name: 'plans', attr: false, type: 'ComparisonPlan[]', default: undefined },
    { name: 'rows', attr: false, type: 'ComparisonRow[]', default: undefined },
    { name: 'stickyHeader', attr: 'sticky-header', type: 'boolean', default: false },
    { name: 'compact', attr: 'compact', type: 'boolean', default: false },
  ],
  events: [
    {
      name: 'mth-select-plan',
      cancelable: false,
      detailType: '{ id: string; name: string }',
    },
  ],
  slots: [
    { name: 'caption', description: 'Optional custom table caption content.' },
    { name: 'footer', description: 'Optional footer content rendered below the table.' },
  ],
  parts: [
    { name: 'base', description: 'Scrollable region wrapper around the table.' },
    { name: 'table', description: 'Semantic `<table>` comparison matrix.' },
    { name: 'caption', description: 'Table caption element.' },
    { name: 'head', description: 'Table header (`<thead>`).' },
    { name: 'body', description: 'Table body (`<tbody>`).' },
    { name: 'plan-header', description: 'Column header `<th scope="col">` for each plan.' },
    { name: 'feature-header', description: 'Row header `<th scope="row">` for each feature.' },
    { name: 'cell', description: 'Comparison value `<td>` cell.' },
    { name: 'badge', description: 'Optional highlighted plan badge.' },
  ],
  messages: {
    tableLabel: 'Comparison table',
    featureColumn: 'Feature',
    included: 'Included',
    notIncluded: 'Not included',
    recommended: 'Recommended',
  },
};

export const CEM_METADATA = {
  description:
    'Accessible feature and plan comparison matrix with semantic `<th scope="col">` and `<th scope="row">` headers, boolean inclusion indicators, and sticky headers.',
  propDescriptions: {
    caption: 'Visible `<caption>` text describing the comparison matrix.',
    label: 'Accessible region and table label when no visible caption is set.',
    plans: 'Array of plan columns (`{ id, name, price?, badge?, highlighted?, actionLabel? }`).',
    rows: 'Array of feature rows (`{ id?, feature, description?, values }`).',
    stickyHeader: 'Pins column headers at the block start while scrolling.',
    compact: 'Applies denser vertical cell padding.',
  },
  eventDescriptions: {
    'mth-select-plan': 'Emitted when a plan header action button is activated.',
  },
  cssProperties: [
    { name: '--mth-color-surface', description: 'Table background color.' },
    { name: '--mth-color-border', description: 'Grid cell border color.' },
    { name: '--mth-color-accent-subtle', description: 'Highlighted plan column tint.' },
  ],
};
