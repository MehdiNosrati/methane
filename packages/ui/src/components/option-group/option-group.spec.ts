import type { ComponentBehaviorSpec } from '@methane/spec-compiler';

export const optionGroupSpec: ComponentBehaviorSpec = {
  tag: 'mth-option-group',
  package: '@methane/ui',
  conformance: [],
  controllers: [],
  focusModel: 'none',
  role: 'group',
  states: ['disabled'],
  keyboard: [],
  props: [
    { name: 'label', attr: 'label', type: 'string', default: '' },
    { name: 'disabled', attr: 'disabled', type: 'boolean', default: false },
  ],
  events: [],
  slots: [
    { name: '', description: 'Grouped `<mth-option>` child elements.' },
    { name: 'label', description: 'Optional custom group header replacing `label`.' },
  ],
  parts: [
    { name: 'base', description: 'Root group container.' },
    { name: 'label', description: 'Group heading label element.' },
    { name: 'options', description: 'Container for grouped option elements.' },
  ],
  messages: {},
};

export const CEM_METADATA = {
  description: 'Semantic option group container with heading label for `<mth-combobox>`.',
  propDescriptions: {
    label: 'Visible and accessible group heading label.',
    disabled: 'Disables all options nested inside the group.',
  },
  cssProperties: [
    { name: '--mth-color-fg-muted', description: 'Group heading foreground color.' },
    { name: '--mth-color-border', description: 'Divider color between option groups.' },
  ],
};
