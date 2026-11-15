import type { ComponentBehaviorSpec } from '@methane/spec-compiler';
import { phoneInputMessages } from './phone-input.messages.js';

export const phoneInputSpec: ComponentBehaviorSpec = {
  tag: 'mth-phone-input',
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
    { name: 'placeholder', attr: 'placeholder', type: 'string', default: '(555) 123-4567' },
    { name: 'autocomplete', attr: 'autocomplete', type: 'string', default: 'tel-national' },
    { name: 'country', attr: 'country', type: 'string', default: 'US' },
    { name: 'dialCode', attr: 'dial-code', type: 'string', default: '+1' },
    { name: 'mask', attr: 'mask', type: 'string', default: '(000) 000-0000' },
    { name: 'disabled', attr: 'disabled', type: 'boolean', default: false },
    { name: 'required', attr: 'required', type: 'boolean', default: false },
    { name: 'readonly', attr: 'readonly', type: 'boolean', default: false },
  ],
  events: [
    { name: 'mth-input', cancelable: false, detailType: '{ value: string; unmasked: string; dialCode: string; e164: string }' },
    { name: 'mth-change', cancelable: false, detailType: '{ value: string; unmasked: string; dialCode: string; e164: string }' },
    { name: 'mth-country-change', cancelable: false, detailType: '{ country: string; dialCode: string }' },
  ],
  slots: [
    { name: 'label', description: 'Optional accessible label slot.' },
    { name: 'hint', description: 'Helper text slot.' },
    { name: 'error', description: 'Error text slot.' },
    { name: 'suffix', description: 'Trailing adornment.' },
  ],
  parts: [
    { name: 'base', description: 'Outer field stack.' },
    { name: 'label', description: 'Shadow `<label>` element.' },
    { name: 'wrapper', description: 'Input box container.' },
    { name: 'country', description: 'Country dial code `<select>`.' },
    { name: 'control', description: 'Masked `<input type="tel">` control.' },
    { name: 'hint', description: 'Hint message container.' },
    { name: 'error', description: 'Error message container.' },
  ],
  messages: { ...phoneInputMessages },
};

export const CEM_METADATA = {
  description:
    'Form-associated international phone number field combining country dial code selection and cursor-preserving pattern masking via `MaskAndFormatEngine`.',
  propDescriptions: {
    value: 'Formatted national phone string.',
    name: 'Form submission field name.',
    label: 'Accessible label rendered inside shadow root.',
    hint: 'Helper text displayed below control.',
    error: 'Explicit custom error message.',
    placeholder: 'Placeholder displayed when empty.',
    autocomplete: 'HTML autocomplete token (defaults to `tel-national`).',
    country: 'ISO 3166-1 alpha-2 country code (e.g. `"US"`, `"GB"`, `"DE"`).',
    dialCode: 'International calling prefix (e.g. `"+1"`, `"+44"`).',
    mask: 'Mask pattern using `0`/`9` digit tokens or custom `#` digits.',
    disabled: 'Disables interaction.',
    required: 'Marks control required.',
    readonly: 'Prevents edits while allowing focus and submission.',
  },
  eventDescriptions: {
    'mth-input': 'Fired synchronously when the phone number updates.',
    'mth-change': 'Fired when the phone number commits.',
    'mth-country-change': 'Fired when the country dial code changes.',
  },
  cssProperties: [
    { name: '--mth-color-surface', description: 'Input background color.' },
    { name: '--mth-color-border', description: 'Default border color.' },
    { name: '--mth-color-border-focus', description: 'Focus ring color.' },
    { name: '--mth-radius-md', description: 'Input corner radius.' },
  ],
};
