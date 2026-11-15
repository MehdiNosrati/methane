import type { ComponentBehaviorSpec } from '@methane/spec-compiler';

export const resizableGroupSpec: ComponentBehaviorSpec = {
  tag: 'mth-resizable-group',
  package: '@methane/ui',
  conformance: [],
  controllers: ['SlotCollectionController'],
  focusModel: 'none',
  states: ['disabled'],
  keyboard: [],
  props: [
    { name: 'orientation', attr: 'orientation', type: "'horizontal' | 'vertical'", default: 'horizontal' },
    { name: 'disabled', attr: 'disabled', type: 'boolean', default: false },
  ],
  events: [
    { name: 'mth-layout', cancelable: false, detailType: '{ sizes: number[] }' },
  ],
  slots: [
    { name: '', description: 'Alternating `<mth-resizable-panel>` and `<mth-resizable-handle>` children.' },
  ],
  parts: [
    { name: 'base', description: 'Flex layout container for panels and handles.' },
  ],
  messages: {},
};

export const CEM_METADATA = {
  description: 'Multi-panel layout coordinator synchronizing adjacent `<mth-resizable-panel>` sizes from `<mth-resizable-handle>` deltas.',
  propDescriptions: {
    orientation: 'Flex direction axis (`horizontal` or `vertical`) propagated to child handles.',
    disabled: 'Disables resizing on all child handles.',
  },
  eventDescriptions: {
    'mth-layout': 'Fired after panel sizes are initialized or adjusted.',
  },
  cssProperties: [],
};
