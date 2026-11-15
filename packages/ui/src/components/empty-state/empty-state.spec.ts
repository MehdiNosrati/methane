import type { ComponentBehaviorSpec } from '@methane/spec-compiler';

export const emptyStateSpec: ComponentBehaviorSpec = {
  tag: 'mth-empty-state',
  package: '@methane/ui',
  conformance: [],
  controllers: [],
  focusModel: 'none',
  states: ['variant', 'tone'],
  keyboard: [],
  props: [
    { name: 'heading', attr: 'heading', type: 'string', default: '' },
    { name: 'description', attr: 'description', type: 'string', default: '' },
    { name: 'variant', attr: 'variant', type: "'default' | 'compact' | 'card'", default: 'default' },
    { name: 'tone', attr: 'tone', type: "'neutral' | 'info' | 'warning' | 'danger'", default: 'neutral' },
    { name: 'align', attr: 'align', type: "'center' | 'start'", default: 'center' },
    { name: 'roleMode', attr: 'role-mode', type: "'region' | 'status' | 'none'", default: 'region' },
  ],
  events: [],
  slots: [
    { name: 'icon', description: 'Optional leading illustration or icon.' },
    { name: 'title', description: 'Optional rich heading overriding the `heading` property.' },
    { name: '', description: 'Body description overriding the `description` property.' },
    { name: 'actions', description: 'Action buttons or links rendered below the description.' },
  ],
  parts: [
    { name: 'base', description: 'Outer empty state container.' },
    { name: 'icon', description: 'Icon wrapper.' },
    { name: 'title', description: 'Heading container.' },
    { name: 'description', description: 'Description text container.' },
    { name: 'actions', description: 'Actions container.' },
  ],
  messages: {
    emptyLabel: 'Empty state',
  },
};

export const CEM_METADATA = {
  description:
    'Accessible empty, no-results, or error placeholder container with optional icon, heading, description, and action slots.',
  propDescriptions: {
    heading: 'Primary empty state heading text.',
    description: 'Secondary explanatory text.',
    variant: 'Visual container layout variant (`default`, `compact`, `card`).',
    tone: 'Semantic icon badge tone (`neutral`, `info`, `warning`, `danger`).',
    align: 'Horizontal alignment (`center` or `start`).',
    roleMode: 'Semantic container role (`region`, `status`, or `none`).',
  },
  eventDescriptions: {},
  cssProperties: [
    { name: '--mth-color-surface', description: 'Card variant background color.' },
    { name: '--mth-color-fg', description: 'Heading text color.' },
    { name: '--mth-color-fg-muted', description: 'Description text color.' },
  ],
};
