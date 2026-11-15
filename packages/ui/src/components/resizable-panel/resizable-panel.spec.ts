import type { ComponentBehaviorSpec } from '@methane-ui/spec-compiler';

export const resizablePanelSpec: ComponentBehaviorSpec = {
  tag: 'mth-resizable-panel',
  package: '@methane-ui/ui',
  conformance: [],
  controllers: [],
  focusModel: 'none',
  states: ['collapsed'],
  keyboard: [],
  props: [
    { name: 'defaultSize', attr: 'default-size', type: 'number', default: 50 },
    { name: 'size', attr: 'size', type: 'number', default: 50 },
    { name: 'minSize', attr: 'min-size', type: 'number', default: 10 },
    { name: 'maxSize', attr: 'max-size', type: 'number', default: 100 },
    { name: 'collapsible', attr: 'collapsible', type: 'boolean', default: false },
    { name: 'collapsed', attr: 'collapsed', type: 'boolean', default: false },
  ],
  events: [
    { name: 'mth-collapse', cancelable: false, detailType: '{ collapsed: boolean }' },
  ],
  slots: [
    { name: '', description: 'Panel body content.' },
  ],
  parts: [
    { name: 'base', description: 'Scroll-safe panel container.' },
  ],
  messages: {},
};

export const CEM_METADATA = {
  description: 'Resizable panel region coordinated inside `<mth-resizable-group>` with optional collapsible minimum threshold.',
  propDescriptions: {
    defaultSize: 'Initial percentage allocation when uninitialized.',
    size: 'Current panel percentage size.',
    minSize: 'Minimum panel size percentage.',
    maxSize: 'Maximum panel size percentage.',
    collapsible: 'Whether the panel can collapse to `0%`.',
    collapsed: 'Whether the panel is currently collapsed.',
  },
  eventDescriptions: {
    'mth-collapse': 'Fired when `collapsed` state toggles.',
  },
  cssProperties: [
    { name: '--mth-color-surface', description: 'Optional panel surface background.' },
  ],
};
