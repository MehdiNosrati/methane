import type { ComponentBehaviorSpec } from '@methane/spec-compiler';
import { addressInputMessages } from './address-input.messages.js';

export const addressInputSpec: ComponentBehaviorSpec = {
  tag: 'mth-address-input',
  package: '@methane/ui',
  conformance: ['form-control'],
  controllers: ['FormControlController', 'InputController', 'ContextProtocol'],
  focusModel: 'delegates-focus',
  states: ['dirty', 'touched', 'user-invalid', 'disabled', 'required', 'readonly'],
  keyboard: [
    { key: 'Tab', when: 'focused inside address grid', expect: 'moves linearly through street, city, region, postal code, and country fields' },
  ],
  props: [
    { name: 'value', attr: 'value', type: 'string', default: '' },
    { name: 'name', attr: 'name', type: 'string', default: '' },
    { name: 'label', attr: 'label', type: 'string', default: '' },
    { name: 'hint', attr: 'hint', type: 'string', default: '' },
    { name: 'error', attr: 'error', type: 'string', default: '' },
    { name: 'includeLine2', attr: 'include-line2', type: 'boolean', default: false },
    { name: 'disabled', attr: 'disabled', type: 'boolean', default: false },
    { name: 'required', attr: 'required', type: 'boolean', default: false },
    { name: 'readonly', attr: 'readonly', type: 'boolean', default: false },
  ],
  events: [
    { name: 'mth-input', cancelable: false, detailType: '{ value: string; address: AddressValue }' },
    { name: 'mth-change', cancelable: false, detailType: '{ value: string; address: AddressValue }' },
  ],
  slots: [
    { name: 'label', description: 'Optional legend label slot.' },
    { name: 'hint', description: 'Helper text slot.' },
    { name: 'error', description: 'Validation error slot.' },
  ],
  parts: [
    { name: 'base', description: 'Outer fieldset container.' },
    { name: 'label', description: 'Legend text inside shadow root.' },
    { name: 'grid', description: 'Responsive logical grid of subfields.' },
    { name: 'control', description: 'Individual address subfield inputs.' },
    { name: 'hint', description: 'Hint message container.' },
    { name: 'error', description: 'Error message container.' },
  ],
  messages: { ...addressInputMessages },
};

export const CEM_METADATA = {
  description:
    'Form-associated structured postal address composite input with autocomplete tokens (`street-address`, `address-level2`, `address-level1`, `postal-code`, `country`).',
  propDescriptions: {
    value: 'Serialized JSON string of structured address fields (empty string when all fields blank).',
    name: 'Form submission field name.',
    label: 'Accessible fieldset legend.',
    hint: 'Helper text displayed below address grid.',
    error: 'Explicit validation error message.',
    includeLine2: 'Displays secondary address line 2 field.',
    disabled: 'Disables all address inputs.',
    required: 'Requires street, city, postal code, and country.',
    readonly: 'Prevents edits while remaining focusable.',
  },
  eventDescriptions: {
    'mth-input': 'Fired synchronously when any address subfield updates.',
    'mth-change': 'Fired when any address subfield commits.',
  },
  cssProperties: [
    { name: '--mth-color-surface', description: 'Subfield input background.' },
    { name: '--mth-color-border', description: 'Subfield border color.' },
    { name: '--mth-color-border-focus', description: 'Focus ring color.' },
    { name: '--mth-radius-md', description: 'Corner radius.' },
  ],
};
