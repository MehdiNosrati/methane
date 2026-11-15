import type { ComponentBehaviorSpec } from '@methane/spec-compiler';
import { maskedInputMessages } from './masked-input.messages.js';

export const maskedInputSpec: ComponentBehaviorSpec = {
  tag: 'mth-masked-input',
  package: '@methane/ui',
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
    { name: 'placeholder', attr: 'placeholder', type: 'string', default: '' },
    { name: 'autocomplete', attr: 'autocomplete', type: 'string', default: '' },
    { name: 'mask', attr: 'mask', type: 'string', default: '0000-0000' },
    { name: 'unmaskOnSubmit', attr: 'unmask-on-submit', type: 'boolean', default: false },
    { name: 'disabled', attr: 'disabled', type: 'boolean', default: false },
    { name: 'required', attr: 'required', type: 'boolean', default: false },
    { name: 'readonly', attr: 'readonly', type: 'boolean', default: false },
  ],
  events: [
    { name: 'mth-input', cancelable: false, detailType: '{ value: string; unmasked: string; complete: boolean }' },
    { name: 'mth-change', cancelable: false, detailType: '{ value: string; unmasked: string; complete: boolean }' },
  ],
  slots: [
    { name: 'label', description: 'Optional accessible label slot.' },
    { name: 'hint', description: 'Helper text slot.' },
    { name: 'error', description: 'Error text slot.' },
    { name: 'prefix', description: 'Leading adornment.' },
    { name: 'suffix', description: 'Trailing adornment.' },
  ],
  parts: [
    { name: 'base', description: 'Outer field stack.' },
    { name: 'label', description: 'Shadow `<label>` element.' },
    { name: 'wrapper', description: 'Input box chrome.' },
    { name: 'control', description: 'Masked `<input>` control.' },
    { name: 'hint', description: 'Hint message container.' },
    { name: 'error', description: 'Error message container.' },
  ],
  messages: { ...maskedInputMessages },
};

export const CEM_METADATA = {
  description:
    'Form-associated pattern-masked input powered by `MaskAndFormatEngine` with cursor-preserving editing and completeness validation.',
  propDescriptions: {
    value: 'Formatted (or unmasked if `unmaskOnSubmit`) input string.',
    name: 'Form submission field name.',
    label: 'Accessible label rendered inside shadow root.',
    hint: 'Helper text displayed below control.',
    error: 'Explicit custom error message.',
    placeholder: 'Placeholder displayed when empty.',
    autocomplete: 'HTML autocomplete attribute forwarded to the control.',
    mask: 'Mask template (`0`/`9`/`#` digit, `A` letter, `*` alphanumeric).',
    unmaskOnSubmit: 'Submits raw unmasked value in FormData while displaying formatted value.',
    disabled: 'Disables user interaction.',
    required: 'Marks field required.',
    readonly: 'Prevents edits while remaining focusable.',
  },
  eventDescriptions: {
    'mth-input': 'Fired synchronously when masked input updates.',
    'mth-change': 'Fired when edited value commits.',
  },
  cssProperties: [
    { name: '--mth-color-surface', description: 'Input background color.' },
    { name: '--mth-color-border', description: 'Default border color.' },
    { name: '--mth-color-border-focus', description: 'Focus ring color.' },
    { name: '--mth-radius-md', description: 'Input corner radius.' },
  ],
};
