import type { ComponentBehaviorSpec } from '@methane-ui/spec-compiler';
import { ibanInputMessages } from './iban-input.messages.js';

export const ibanInputSpec: ComponentBehaviorSpec = {
  tag: 'mth-iban-input',
  package: '@methane-ui/ui',
  conformance: ['form-control'],
  controllers: ['FormControlController', 'InputController', 'MaskAndFormatEngine', 'ContextProtocol'],
  focusModel: 'delegates-focus',
  states: ['dirty', 'touched', 'user-invalid', 'disabled', 'required', 'readonly'],
  keyboard: [
    { key: 'Enter', when: 'inside a form and not composing IME', expect: 'requests submission of owning form' },
  ],
  props: [
    { name: 'value', attr: 'value', type: 'string', default: '' },
    { name: 'name', attr: 'name', type: 'string', default: '' },
    { name: 'label', attr: 'label', type: 'string', default: '' },
    { name: 'hint', attr: 'hint', type: 'string', default: '' },
    { name: 'error', attr: 'error', type: 'string', default: '' },
    { name: 'placeholder', attr: 'placeholder', type: 'string', default: 'DE89 3704 0044 0532 0130 00' },
    { name: 'autocomplete', attr: 'autocomplete', type: 'string', default: 'off' },
    { name: 'disabled', attr: 'disabled', type: 'boolean', default: false },
    { name: 'required', attr: 'required', type: 'boolean', default: false },
    { name: 'readonly', attr: 'readonly', type: 'boolean', default: false },
  ],
  events: [
    { name: 'mth-input', cancelable: false, detailType: '{ value: string; unmasked: string; valid: boolean }' },
    { name: 'mth-change', cancelable: false, detailType: '{ value: string; unmasked: string; valid: boolean }' },
  ],
  slots: [
    { name: 'label', description: 'Optional accessible label slot.' },
    { name: 'hint', description: 'Helper text slot.' },
    { name: 'error', description: 'Error text slot.' },
  ],
  parts: [
    { name: 'base', description: 'Outer field stack.' },
    { name: 'label', description: 'Shadow `<label>` element.' },
    { name: 'wrapper', description: 'Input box container.' },
    { name: 'country', description: 'Detected 2-letter IBAN country prefix badge.' },
    { name: 'control', description: 'Uppercase 4-char grouped `<input>` element.' },
    { name: 'hint', description: 'Hint message container.' },
    { name: 'error', description: 'Error message container.' },
  ],
  messages: { ...ibanInputMessages },
};

export const CEM_METADATA = {
  description:
    'Form-associated International Bank Account Number (IBAN) input with 4-character grouping (`MaskAndFormatEngine`) and ISO 13616 MOD-97-10 checksum validation.',
  propDescriptions: {
    value: 'Formatted 4-character grouped IBAN string.',
    name: 'Form submission field name.',
    label: 'Accessible label rendered inside shadow root.',
    hint: 'Helper text displayed below control.',
    error: 'Explicit custom error message.',
    placeholder: 'Placeholder displayed when empty.',
    autocomplete: 'HTML autocomplete attribute.',
    disabled: 'Disables interaction.',
    required: 'Marks IBAN field required.',
    readonly: 'Prevents edits while remaining focusable.',
  },
  eventDescriptions: {
    'mth-input': 'Fired synchronously when IBAN input updates.',
    'mth-change': 'Fired when edited IBAN commits.',
  },
  cssProperties: [
    { name: '--mth-color-surface', description: 'Input background color.' },
    { name: '--mth-color-border', description: 'Default border color.' },
    { name: '--mth-color-border-focus', description: 'Focus outline color.' },
    { name: '--mth-radius-md', description: 'Input corner radius.' },
  ],
};
