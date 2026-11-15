import type { ComponentBehaviorSpec } from '@methane-ui/spec-compiler';

export const scrollAreaSpec: ComponentBehaviorSpec = {
  tag: 'mth-scroll-area',
  package: '@methane-ui/ui',
  conformance: [],
  controllers: ['ObserverPoolController'],
  focusModel: 'delegates-focus',
  states: ['scrolling'],
  keyboard: [
    { key: 'ArrowDown', when: 'Viewport is focused', expect: 'Scrolls block axis forward natively' },
    { key: 'PageDown', when: 'Viewport is focused', expect: 'Scrolls viewport by one page' },
  ],
  props: [
    { name: 'type', attr: 'type', type: "'auto' | 'always' | 'scroll' | 'hover'", default: 'hover' },
    { name: 'orientation', attr: 'orientation', type: "'vertical' | 'horizontal' | 'both'", default: 'vertical' },
    { name: 'label', attr: 'label', type: 'string', default: '' },
  ],
  events: [
    { name: 'mth-scroll', cancelable: false, detailType: '{ scrollTop: number; scrollLeft: number }' },
  ],
  slots: [
    { name: '', description: 'Scrollable region content.' },
  ],
  parts: [
    { name: 'base', description: 'Outer scroll-area container.' },
    { name: 'viewport', description: 'Focusable scrollable viewport element.' },
    { name: 'content', description: 'Inner content wrapper.' },
    { name: 'scrollbar-y', description: 'Custom vertical scrollbar track.' },
    { name: 'thumb-y', description: 'Custom vertical scrollbar thumb.' },
    { name: 'scrollbar-x', description: 'Custom horizontal scrollbar track.' },
    { name: 'thumb-x', description: 'Custom horizontal scrollbar thumb.' },
  ],
  messages: {},
};

export const CEM_METADATA = {
  description: 'Custom-styled accessible scroll container with logical scrollbar indicators updated via `ObserverPoolController` and CSP-safe `adoptedStyleSheets`.',
  propDescriptions: {
    type: 'Scrollbar visibility policy (`auto`, `always`, `scroll`, or `hover`).',
    orientation: 'Allowed scroll axes (`vertical`, `horizontal`, or `both`).',
    label: 'Optional accessible region label when viewport is scrollable.',
  },
  eventDescriptions: {
    'mth-scroll': 'Fired when the viewport scrolls.',
  },
  cssProperties: [
    { name: '--mth-color-border-strong', description: 'Scrollbar thumb resting color.' },
    { name: '--mth-color-fg-subtle', description: 'Scrollbar thumb hover color.' },
  ],
};
