import type { ComponentBehaviorSpec } from '@methane-ui/spec-compiler';

export const tabPanelSpec: ComponentBehaviorSpec = {
  tag: 'mth-tab-panel',
  package: '@methane-ui/ui',
  conformance: [],
  controllers: [],
  focusModel: 'none',
  role: 'tabpanel',
  states: ['active'],
  keyboard: [],
  props: [
    { name: 'value', attr: 'value', type: 'string', default: '' },
    { name: 'active', attr: 'active', type: 'boolean', default: false },
  ],
  events: [],
  slots: [{ name: '', description: 'Tab panel body content.' }],
  parts: [{ name: 'base', description: 'Panel region container.' }],
  messages: {},
};

export const CEM_METADATA = {
  description: 'Content region controlled by an `<mth-tab>` inside `<mth-tabs>`.',
  propDescriptions: {
    value: 'Identifier matching the associated `<mth-tab>` `value`.',
    active: 'Shows the panel when true; hides it from layout and assistive technology otherwise.',
  },
  cssProperties: [
    { name: '--mth-space-4', description: 'Panel inner block padding.' },
  ],
};
