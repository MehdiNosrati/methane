import type { ComponentBehaviorSpec } from '@methane-ui/spec-compiler';

export const masonrySpec: ComponentBehaviorSpec = {
  tag: 'mth-masonry',
  package: '@methane-ui/ui',
  conformance: [],
  controllers: ['ObserverPoolController'],
  focusModel: 'none',
  states: [],
  keyboard: [],
  props: [
    { name: 'columns', attr: 'columns', type: 'number', default: 0 },
    { name: 'minColumnWidth', attr: 'min-column-width', type: 'number', default: 240 },
    { name: 'gap', attr: 'gap', type: 'string', default: '1rem' },
  ],
  events: [
    { name: 'mth-layout', cancelable: false, detailType: '{ columns: number }' },
  ],
  slots: [
    { name: '', description: 'Cards or items arranged in masonry columns.' },
  ],
  parts: [
    { name: 'base', description: 'Multi-column masonry container.' },
  ],
  messages: {},
};

export const CEM_METADATA = {
  description: 'Responsive multi-column masonry grid adapting column count dynamically via `ObserverPoolController`.',
  propDescriptions: {
    columns: 'Explicit column count (`0` computes columns automatically from container inline size and `minColumnWidth`).',
    minColumnWidth: 'Minimum column width in pixels used when `columns` is `0`.',
    gap: 'CSS length between columns and stacked items.',
  },
  eventDescriptions: {
    'mth-layout': 'Fired when the resolved column count changes.',
  },
  cssProperties: [],
};
