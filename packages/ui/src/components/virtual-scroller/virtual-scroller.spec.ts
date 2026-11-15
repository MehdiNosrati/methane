import type { ComponentBehaviorSpec } from '@methane/spec-compiler';

export const virtualScrollerSpec: ComponentBehaviorSpec = {
  tag: 'mth-virtual-scroller',
  package: '@methane/ui',
  conformance: [],
  controllers: ['VirtualizerController', 'ObserverPoolController'],
  focusModel: 'delegates-focus',
  states: [],
  keyboard: [
    { key: 'PageDown', when: 'Viewport is focused', expect: 'Scrolls windowed list forward and updates rendered items' },
    { key: 'PageUp', when: 'Viewport is focused', expect: 'Scrolls windowed list backward and updates rendered items' },
  ],
  props: [
    { name: 'estimateSize', attr: 'estimate-size', type: 'number', default: 48 },
    { name: 'overscan', attr: 'overscan', type: 'number', default: 3 },
    { name: 'viewportHeight', attr: 'viewport-height', type: 'number', default: 320 },
    { name: 'label', attr: 'label', type: 'string', default: '' },
  ],
  events: [
    { name: 'mth-range-change', cancelable: false, detailType: '{ startIndex: number; endIndex: number }' },
  ],
  slots: [
    { name: '', description: 'Fallback content rendered when `.items` is empty.' },
  ],
  parts: [
    { name: 'viewport', description: 'Scrollable virtual viewport container.' },
    { name: 'spacer', description: 'Total-height spacer positioning virtualized rows.' },
    { name: 'item', description: 'Individual rendered virtual row wrapper.' },
  ],
  messages: {},
};

export const CEM_METADATA = {
  description: 'Windowed list virtualizer backed by `VirtualizerController` with prefix-sum variable sizing and dynamic measurement.',
  propDescriptions: {
    estimateSize: 'Default estimated block-size per item in pixels.',
    overscan: 'Number of extra items rendered outside the visible viewport.',
    viewportHeight: 'Fallback viewport height in pixels before resize measurement.',
    label: 'Optional accessible `aria-label` on the virtual list region.',
  },
  eventDescriptions: {
    'mth-range-change': 'Fired when the visible `[startIndex, endIndex]` slice changes.',
  },
  cssProperties: [
    { name: '--mth-color-border', description: 'Viewport border color.' },
  ],
};
