import type { ComponentBehaviorSpec } from '@methane-ui/spec-compiler';

export const breadcrumbPathSpec: ComponentBehaviorSpec = {
  tag: 'mth-breadcrumb-path',
  package: '@methane-ui/ui',
  conformance: [],
  controllers: ['ObserverPoolController'],
  focusModel: 'delegates-focus',
  states: ['collapsed'],
  keyboard: [
    { key: 'Enter', when: 'Ellipsis expand button is focused', expect: 'Expands collapsed middle breadcrumb segments' },
  ],
  props: [
    { name: 'maxItems', attr: 'max-items', type: 'number', default: 0 },
    { name: 'separator', attr: 'separator', type: 'string', default: '/' },
    { name: 'label', attr: 'label', type: 'string', default: '' },
    { name: 'expanded', attr: 'expanded', type: 'boolean', default: false },
  ],
  events: [
    { name: 'mth-navigate', cancelable: true, detailType: '{ item: MthBreadcrumbPathItem; index: number }' },
    { name: 'mth-expand', cancelable: false, detailType: '{ expanded: true }' },
  ],
  slots: [],
  parts: [
    { name: 'base', description: 'Semantic `<nav>` breadcrumb landmark.' },
    { name: 'list', description: 'Ordered `<ol>` list of path segments.' },
    { name: 'item', description: 'Breadcrumb `<li>` entry.' },
    { name: 'link', description: 'Navigable `<a>` or text segment.' },
    { name: 'ellipsis', description: 'Button expanding collapsed intermediate segments.' },
    { name: 'separator', description: 'Decorative separator (`aria-hidden="true"`).' },
  ],
  messages: {
    label: 'Breadcrumb',
    expandPath: 'Show full path',
  },
};

export const CEM_METADATA = {
  description: 'Data-driven breadcrumb path trail with safe-href links, middle-segment ellipsis collapsing, and responsive overflow handling.',
  propDescriptions: {
    maxItems: 'Maximum visible items before collapsing middle segments (`0` shows all items unless overflowing).',
    separator: 'Visual separator glyph between path segments.',
    label: 'Accessible landmark `aria-label` for `<nav>`.',
    expanded: 'Reveals all collapsed middle items when set.',
  },
  eventDescriptions: {
    'mth-navigate': 'Cancelable event fired when a breadcrumb link is clicked.',
    'mth-expand': 'Fired when the collapsed ellipsis button is activated.',
  },
  cssProperties: [
    { name: '--mth-color-fg-muted', description: 'Inactive segment and separator text color.' },
    { name: '--mth-color-fg', description: 'Current segment text color.' },
  ],
};
