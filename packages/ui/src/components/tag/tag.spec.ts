import type { ComponentBehaviorSpec } from '@methane/spec-compiler';

export const tagSpec: ComponentBehaviorSpec = {
  tag: 'mth-tag',
  package: '@methane/ui',
  conformance: [],
  controllers: [],
  focusModel: 'delegates-focus',
  states: ['disabled', 'removable', 'selected', 'interactive'],
  keyboard: [
    {
      key: 'Enter',
      when: 'Interactive tag trigger is focused',
      expect: 'Activates tag and emits mth-click',
    },
    {
      key: ' ',
      when: 'Interactive tag trigger is focused',
      expect: 'Activates tag and emits mth-click',
    },
    {
      key: 'Backspace',
      when: 'Removable tag is focused',
      expect: 'Dispatches cancelable mth-remove',
    },
    {
      key: 'Delete',
      when: 'Removable tag is focused',
      expect: 'Dispatches cancelable mth-remove',
    },
  ],
  props: [
    { name: 'variant', attr: 'variant', type: "'neutral' | 'accent' | 'success' | 'warning' | 'danger'", default: 'neutral' },
    { name: 'size', attr: 'size', type: "'sm' | 'md' | 'lg'", default: 'md' },
    { name: 'pill', attr: 'pill', type: 'boolean', default: false },
    { name: 'removable', attr: 'removable', type: 'boolean', default: false },
    { name: 'disabled', attr: 'disabled', type: 'boolean', default: false },
    { name: 'interactive', attr: 'interactive', type: 'boolean', default: false },
    { name: 'selected', attr: 'selected', type: 'boolean', default: false },
    { name: 'value', attr: 'value', type: 'string', default: '' },
    { name: 'label', attr: 'label', type: 'string', default: '' },
  ],
  events: [
    {
      name: 'mth-click',
      cancelable: false,
      detailType: '{ value: string; selected: boolean }',
    },
    {
      name: 'mth-remove',
      cancelable: true,
      detailType: '{ value: string }',
    },
  ],
  slots: [
    { name: 'prefix', description: 'Leading icon or indicator slot.' },
    { name: '', description: 'Tag label content.' },
    { name: 'suffix', description: 'Trailing metadata or icon slot.' },
  ],
  parts: [
    { name: 'base', description: 'Outer tag pill container.' },
    { name: 'trigger', description: 'Label content wrapper or interactive button.' },
    { name: 'prefix', description: 'Leading slot wrapper.' },
    { name: 'label', description: 'Primary label slot wrapper.' },
    { name: 'suffix', description: 'Trailing slot wrapper.' },
    { name: 'remove', description: 'Dismissal button rendered when `removable` is true.' },
  ],
  messages: {
    removeTag: 'Remove tag',
    removeTagNamed: 'Remove {label}',
  },
};

export const CEM_METADATA = {
  description: 'Compact categorization tag with semantic variants, optional interactive selection, and accessible removal button.',
  propDescriptions: {
    variant: 'Semantic color variant (`neutral`, `accent`, `success`, `warning`, `danger`).',
    size: 'Visual size scale (`sm`, `md`, `lg`).',
    pill: 'Applies fully rounded pill corners.',
    removable: 'Renders a dismissal button that emits `mth-remove`.',
    disabled: 'Disables interaction and removal.',
    interactive: 'Renders the tag label inside a native toggleable button.',
    selected: 'Selected state reflected on interactive tags.',
    value: 'Optional programmatic value included in emitted event details.',
    label: 'Fallback text label when default slot is empty.',
  },
  eventDescriptions: {
    'mth-click': 'Emitted when an interactive tag is activated.',
    'mth-remove': 'Cancelable event emitted when the remove control or Delete/Backspace is activated.',
  },
  cssProperties: [
    { name: '--mth-color-bg-subtle', description: 'Default tag background color.' },
    { name: '--mth-color-fg', description: 'Default tag text color.' },
    { name: '--mth-color-border', description: 'Default tag border color.' },
  ],
};
