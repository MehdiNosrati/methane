import type { ComponentBehaviorSpec } from '@methane-ui/spec-compiler';

export const tabSpec: ComponentBehaviorSpec = {
  tag: 'mth-tab',
  package: '@methane-ui/ui',
  conformance: [],
  controllers: [],
  focusModel: 'host',
  role: 'tab',
  states: ['selected', 'disabled'],
  keyboard: [
    { key: 'Enter', when: 'Tab is focused and enabled inside mth-tabs', expect: 'Activates this tab and selects its panel' },
    { key: ' ', when: 'Tab is focused and enabled inside mth-tabs', expect: 'Activates this tab and selects its panel' },
  ],
  props: [
    { name: 'value', attr: 'value', type: 'string', default: '' },
    { name: 'selected', attr: 'selected', type: 'boolean', default: false },
    { name: 'disabled', attr: 'disabled', type: 'boolean', default: false },
  ],
  events: [],
  slots: [
    { name: '', description: 'Tab label text.' },
    { name: 'prefix', description: 'Optional leading icon.' },
    { name: 'suffix', description: 'Optional trailing badge or count.' },
  ],
  parts: [{ name: 'base', description: 'Tab button surface container.' }],
  messages: {},
};

export const CEM_METADATA = {
  description: 'Selectable tab trigger for `<mth-tabs>` implementing APG `role="tab"` semantics.',
  propDescriptions: {
    value: 'Identifier matching the corresponding `<mth-tab-panel>` `value`.',
    selected: 'Marks this tab as the active selection.',
    disabled: 'Prevents focus activation and selection.',
  },
  cssProperties: [
    { name: '--mth-color-accent', description: 'Selected tab indicator and foreground color.' },
    { name: '--mth-color-fg-muted', description: 'Inactive tab text color.' },
  ],
};
