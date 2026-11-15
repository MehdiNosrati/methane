import type { ComponentBehaviorSpec } from '@methane/spec-compiler';
import { radioMessages } from './radio.messages.js';

export const radioSpec: ComponentBehaviorSpec = {
  tag: 'mth-radio',
  package: '@methane/ui',
  conformance: [],
  controllers: [],
  focusModel: 'host',
  role: 'radio',
  states: ['checked', 'disabled'],
  keyboard: [
    { key: ' ', when: 'focused and not disabled', expect: 'emits selection intent for this radio option' },
  ],
  props: [
    { name: 'value', attr: 'value', type: 'string', default: '' },
    { name: 'checked', attr: 'checked', type: 'boolean', default: false },
    { name: 'disabled', attr: 'disabled', type: 'boolean', default: false },
    { name: 'label', attr: 'label', type: 'string', default: '' },
  ],
  events: [
    { name: 'mth-radio-select', cancelable: false, detailType: '{ value: string }' },
  ],
  slots: [
    { name: '', description: 'Radio option label content.' },
  ],
  parts: [
    { name: 'base', description: 'Outer radio item wrapper.' },
    { name: 'control', description: 'Circular radio indicator ring.' },
    { name: 'indicator', description: 'Inner checked dot.' },
    { name: 'label', description: 'Option label container.' },
  ],
  messages: { ...radioMessages },
};

export const CEM_METADATA = {
  description: 'Accessible radio option designed for composition inside `<mth-radio-group>`.',
  propDescriptions: {
    value: 'Value submitted by the parent radio group when selected.',
    checked: 'Whether this radio option is currently selected.',
    disabled: 'Disables this individual radio option.',
    label: 'Fallback label text when default slot is empty.',
  },
  eventDescriptions: {
    'mth-radio-select': 'Fired when user clicks or presses Space on the radio option.',
  },
  cssProperties: [
    { name: '--mth-color-surface', description: 'Radio circle background color.' },
    { name: '--mth-color-accent', description: 'Checked border and indicator dot color.' },
    { name: '--mth-color-border-strong', description: 'Unchecked border color.' },
    { name: '--mth-color-border-focus', description: 'Focus ring color.' },
  ],
};
