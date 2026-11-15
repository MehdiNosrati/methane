import type { ComponentBehaviorSpec } from '@methane/spec-compiler';

export const breadcrumbItemSpec: ComponentBehaviorSpec = {
  tag: 'mth-breadcrumb-item',
  package: '@methane/ui',
  conformance: [],
  controllers: [],
  focusModel: 'none',
  role: 'listitem',
  states: ['current'],
  keyboard: [],
  props: [
    { name: 'href', attr: 'href', type: 'string', default: '' },
    { name: 'target', attr: 'target', type: 'string', default: '' },
    { name: 'rel', attr: 'rel', type: 'string', default: '' },
    { name: 'current', attr: 'current', type: 'boolean', default: false },
    { name: 'separator', attr: 'separator', type: 'string', default: '/' },
  ],
  events: [],
  slots: [
    { name: '', description: 'Breadcrumb item label content.' },
    { name: 'separator', description: 'Optional custom separator between items.' },
  ],
  parts: [
    { name: 'base', description: 'Root item container.' },
    { name: 'link', description: 'Anchor rendered when `href` is set and not `current`.' },
    { name: 'label', description: 'Text span rendered for current or non-linked item.' },
    { name: 'separator', description: 'Decorative separator hidden on the last item.' },
  ],
  messages: {},
};

export const CEM_METADATA = {
  description: 'Navigation trail entry for `<mth-breadcrumbs>` with safe link handling and `aria-current="page"`.',
  propDescriptions: {
    href: 'Optional safe destination URL.',
    target: 'Link target context when `href` is provided.',
    rel: 'Relationship attribute (auto-adds `noopener noreferrer` when `target="_blank"`).',
    current: 'Marks this item as the active page with `aria-current="page"`.',
    separator: 'Separator text injected between breadcrumb items (inherited from `<mth-breadcrumbs>` if unset).',
  },
  cssProperties: [
    { name: '--mth-color-fg-muted', description: 'Breadcrumb link text color.' },
    { name: '--mth-color-fg', description: 'Current breadcrumb label text color.' },
  ],
};
