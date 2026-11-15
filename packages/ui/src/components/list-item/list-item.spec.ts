import type { ComponentBehaviorSpec } from '@methane/spec-compiler';

export const listItemSpec: ComponentBehaviorSpec = {
  tag: 'mth-list-item',
  package: '@methane/ui',
  conformance: [],
  controllers: [],
  focusModel: 'host',
  role: 'listitem',
  states: ['selected', 'disabled', 'interactive'],
  keyboard: [],
  props: [
    { name: 'value', attr: 'value', type: 'string', default: '' },
    { name: 'description', attr: 'description', type: 'string', default: '' },
    { name: 'selected', attr: 'selected', type: 'boolean', default: false },
    { name: 'disabled', attr: 'disabled', type: 'boolean', default: false },
    { name: 'interactive', attr: 'interactive', type: 'boolean', default: false },
    { name: 'href', attr: 'href', type: 'string', default: '' },
  ],
  events: [],
  slots: [
    { name: 'prefix', description: 'Leading avatar, icon, or indicator slot.' },
    { name: '', description: 'Primary item label or body content.' },
    { name: 'description', description: 'Secondary supporting description slot.' },
    { name: 'suffix', description: 'Trailing metadata, badge, or action slot.' },
  ],
  parts: [
    { name: 'base', description: 'Outer list item row container.' },
    { name: 'prefix', description: 'Leading slot wrapper.' },
    { name: 'content', description: 'Primary title and description column.' },
    { name: 'title', description: 'Primary text wrapper.' },
    { name: 'description', description: 'Secondary description wrapper.' },
    { name: 'suffix', description: 'Trailing slot wrapper.' },
    { name: 'link', description: 'Anchor element rendered when safe `href` is set.' },
  ],
  messages: {
    itemLabel: 'List item',
  },
};

export const CEM_METADATA = {
  description: 'Semantic list row (`role="listitem"`) for `<mth-list>` with prefix/suffix slots, secondary description, selection state, and safe link support.',
  propDescriptions: {
    value: 'Unique item value identifier used by parent `<mth-list>` selection.',
    description: 'Optional secondary text rendered below the primary content.',
    selected: 'Marks the item as selected.',
    disabled: 'Disables interaction and excludes item from roving keyboard focus.',
    interactive: 'Enables pointer hover/focus affordances.',
    href: 'Optional validated destination URL (`https:`, `http:`, `mailto:`, `tel:`, or relative path).',
  },
  eventDescriptions: {},
  cssProperties: [
    { name: '--mth-color-surface', description: 'Item background color.' },
    { name: '--mth-color-accent-subtle', description: 'Selected item background color.' },
    { name: '--mth-space-3', description: 'Inline and block item padding.' },
  ],
};
