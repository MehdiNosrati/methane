import type { ComponentBehaviorSpec } from '@methane/spec-compiler';

export const breadcrumbsSpec: ComponentBehaviorSpec = {
  tag: 'mth-breadcrumbs',
  package: '@methane/ui',
  conformance: [],
  controllers: ['SlotCollectionController'],
  focusModel: 'none',
  states: [],
  keyboard: [],
  props: [
    { name: 'separator', attr: 'separator', type: 'string', default: '/' },
    { name: 'label', attr: 'label', type: 'string', default: '' },
  ],
  events: [],
  slots: [{ name: '', description: 'Ordered `<mth-breadcrumb-item>` children.' }],
  parts: [
    { name: 'base', description: 'Semantic `<nav>` landmark container.' },
    { name: 'list', description: 'Ordered `<ol>` container for slotted items.' },
  ],
  messages: {
    breadcrumbsLabel: 'Breadcrumb',
  },
};

export const CEM_METADATA = {
  description: 'Accessible breadcrumb navigation landmark (`<nav aria-label>`) arranging `<mth-breadcrumb-item>` children.',
  propDescriptions: {
    separator: 'Default separator string applied to child `<mth-breadcrumb-item>` elements.',
    label: 'Accessible navigation landmark label (defaults to localized `Breadcrumb`).',
  },
  cssProperties: [
    { name: '--mth-space-2', description: 'Gap between breadcrumb items.' },
  ],
};
