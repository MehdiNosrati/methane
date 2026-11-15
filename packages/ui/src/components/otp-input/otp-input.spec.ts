import type { ComponentBehaviorSpec } from '@methane-ui/spec-compiler';
import { otpInputMessages } from './otp-input.messages.js';

export const otpInputSpec: ComponentBehaviorSpec = {
  tag: 'mth-otp-input',
  package: '@methane-ui/ui',
  conformance: ['form-control', 'roving-focus'],
  controllers: ['FormControlController', 'InputController', 'RovingFocusController', 'ContextProtocol'],
  focusModel: 'delegates-focus',
  states: ['dirty', 'touched', 'user-invalid', 'disabled', 'required', 'readonly'],
  keyboard: [
    { key: 'ArrowRight', when: 'cell focused in LTR', expect: 'moves focus to next OTP cell' },
    { key: 'ArrowLeft', when: 'cell focused in LTR', expect: 'moves focus to previous OTP cell' },
    { key: 'Backspace', when: 'empty cell focused', expect: 'focuses and clears previous cell' },
  ],
  props: [
    { name: 'value', attr: 'value', type: 'string', default: '' },
    { name: 'name', attr: 'name', type: 'string', default: '' },
    { name: 'label', attr: 'label', type: 'string', default: '' },
    { name: 'hint', attr: 'hint', type: 'string', default: '' },
    { name: 'error', attr: 'error', type: 'string', default: '' },
    { name: 'length', attr: 'length', type: 'number', default: 6 },
    { name: 'alphanumeric', attr: 'alphanumeric', type: 'boolean', default: false },
    { name: 'masked', attr: 'masked', type: 'boolean', default: false },
    { name: 'autocomplete', attr: 'autocomplete', type: 'string', default: 'one-time-code' },
    { name: 'disabled', attr: 'disabled', type: 'boolean', default: false },
    { name: 'required', attr: 'required', type: 'boolean', default: false },
    { name: 'readonly', attr: 'readonly', type: 'boolean', default: false },
  ],
  events: [
    { name: 'mth-input', cancelable: false, detailType: '{ value: string }' },
    { name: 'mth-change', cancelable: false, detailType: '{ value: string }' },
    { name: 'mth-complete', cancelable: false, detailType: '{ value: string }' },
  ],
  slots: [
    { name: 'label', description: 'Optional accessible label slot.' },
    { name: 'hint', description: 'Helper text slot.' },
    { name: 'error', description: 'Error text slot.' },
  ],
  parts: [
    { name: 'base', description: 'Outer field stack.' },
    { name: 'label', description: 'Group label element.' },
    { name: 'cells', description: 'Row of single-character input cells.' },
    { name: 'cell', description: 'Individual OTP `<input>` cell.' },
    { name: 'hint', description: 'Hint message container.' },
    { name: 'error', description: 'Error message container.' },
  ],
  messages: { ...otpInputMessages },
};

export const CEM_METADATA = {
  description:
    'Form-associated one-time passcode input with segmented cells, paste distribution, roving keyboard focus, and `autocomplete="one-time-code"` support.',
  propDescriptions: {
    value: 'Concatenated OTP string across all cells.',
    name: 'Form submission field name.',
    label: 'Accessible group label.',
    hint: 'Helper text displayed below cells.',
    error: 'Explicit custom error message.',
    length: 'Number of character cells (defaults to 6).',
    alphanumeric: 'Accepts letters and digits instead of digits only.',
    masked: 'Uses `type="password"` for each cell.',
    autocomplete: 'HTML autocomplete attribute forwarded to the first cell.',
    disabled: 'Disables all OTP cells.',
    required: 'Marks OTP input required.',
    readonly: 'Prevents edits while remaining focusable.',
  },
  eventDescriptions: {
    'mth-input': 'Fired synchronously when any cell changes.',
    'mth-change': 'Fired when OTP input commits.',
    'mth-complete': 'Fired when all `length` cells are populated.',
  },
  cssProperties: [
    { name: '--mth-color-surface', description: 'Cell background color.' },
    { name: '--mth-color-border', description: 'Cell border color.' },
    { name: '--mth-color-border-focus', description: 'Active cell outline color.' },
    { name: '--mth-radius-md', description: 'Cell corner radius.' },
  ],
};
