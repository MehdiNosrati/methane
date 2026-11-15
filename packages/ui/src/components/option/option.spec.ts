import type { ComponentBehaviorSpec } from '@methane/spec-compiler';

export const optionSpec: ComponentBehaviorSpec = {
  tag: 'mth-option',
  package: '@methane/ui',
  conformance: [],
  controllers: [],
  focusModel: 'none',
  role: 'option',
  states: ['selected', 'disabled', 'active'],
  keyboard: [],
  props: [
    { name: 'value', attr: 'value', type: 'string', default: '' },
    { name: 'label', attr: 'label', type: 'string', default: '' },
    { name: 'disabled', attr: 'disabled', type: 'boolean', default: false },
    { name: 'selected', attr: 'selected', type: 'boolean', default: false },
    { name: 'active', attr: 'active', type: 'boolean', default: false },
  ],
  events: [],
  slots: [
    { name: '', description: 'Primary option label content.' },
    { name: 'prefix', description: 'Optional leading icon or visual indicator.' },
    { name: 'suffix', description: 'Optional trailing hint, shortcut, or metadata.' },
  ],
  parts: [
    { name: 'base', description: 'Root layout container inside shadow DOM.' },
    { name: 'check', description: 'Selected state checkmark indicator.' },
    { name: 'label', description: 'Option text wrapper.' },
  ],
  messages: {},
};

export const CEM_METADATA = {
  description: 'Selectable option item for `<mth-combobox>` and list containers.',
  propDescriptions: {
    value: 'Machine-readable value submitted when selected.',
    label: 'Optional explicit display label overriding slotted text content.',
    disabled: 'Prevents the option from being activated or selected.',
    selected: 'Marks whether the option is currently selected.',
    active: 'Marks whether the option is currently highlighted via keyboard or pointer.',
  },
  cssProperties: [
    { name: '--mth-color-accent-subtle', description: 'Selected option background highlight.' },
    { name: '--mth-color-bg-subtle', description: 'Active option background highlight.' },
    { name: '--mth-color-fg', description: 'Option label foreground color.' },
    { name: '--mth-radius-sm', description: 'Option item corner radius.' },
  ],
};
