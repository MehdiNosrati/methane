import type { ComponentBehaviorSpec } from '@methane-ui/spec-compiler';
import { passwordInputMessages } from './password-input.messages.js';

export const passwordInputSpec: ComponentBehaviorSpec = {
  tag: 'mth-password-input',
  package: '@methane-ui/ui',
  conformance: ['form-control'],
  controllers: ['FormControlController', 'InputController', 'ContextProtocol'],
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
    { name: 'autocomplete', attr: 'autocomplete', type: 'string', default: 'current-password' },
    { name: 'revealed', attr: 'revealed', type: 'boolean', default: false },
    { name: 'toggleable', attr: 'toggleable', type: 'boolean', default: true },
    { name: 'showStrength', attr: 'show-strength', type: 'boolean', default: false },
    { name: 'minlength', attr: 'minlength', type: 'number', default: 0 },
    { name: 'disabled', attr: 'disabled', type: 'boolean', default: false },
    { name: 'required', attr: 'required', type: 'boolean', default: false },
    { name: 'readonly', attr: 'readonly', type: 'boolean', default: false },
  ],
  events: [
    { name: 'mth-input', cancelable: false, detailType: '{ value: string }' },
    { name: 'mth-change', cancelable: false, detailType: '{ value: string }' },
    { name: 'mth-reveal-change', cancelable: false, detailType: '{ revealed: boolean }' },
  ],
  slots: [
    { name: 'label', description: 'Optional accessible label slot.' },
    { name: 'hint', description: 'Helper text slot.' },
    { name: 'error', description: 'Validation error slot.' },
    { name: 'prefix', description: 'Leading adornment.' },
  ],
  parts: [
    { name: 'base', description: 'Outer field container.' },
    { name: 'label', description: 'Shadow `<label>` element.' },
    { name: 'wrapper', description: 'Input box container.' },
    { name: 'control', description: 'Internal `<input>` control.' },
    { name: 'toggle', description: 'Password visibility toggle button.' },
    { name: 'strength', description: 'Strength meter container.' },
    { name: 'strength-bar', description: 'Strength indicator fill bar.' },
    { name: 'hint', description: 'Hint message container.' },
    { name: 'error', description: 'Error message container.' },
  ],
  messages: { ...passwordInputMessages },
};

export const CEM_METADATA = {
  description:
    'Form-associated password input with visibility toggle, optional password strength meter, minlength validation, and same-root ARIA.',
  propDescriptions: {
    value: 'Current password value.',
    name: 'Form submission field name.',
    label: 'Accessible label rendered inside shadow root.',
    hint: 'Helper text displayed below input.',
    error: 'Explicit custom error message.',
    placeholder: 'Hint displayed when empty.',
    autocomplete: 'HTML autocomplete token (defaults to `current-password`).',
    revealed: 'When true, shows plaintext (`type="text"`).',
    toggleable: 'Displays visibility toggle button.',
    showStrength: 'Displays live password strength indicator.',
    minlength: 'Minimum required length when non-empty.',
    disabled: 'Disables interaction.',
    required: 'Marks control required.',
    readonly: 'Prevents edits while remaining focusable.',
  },
  eventDescriptions: {
    'mth-input': 'Fired synchronously on edits.',
    'mth-change': 'Fired when edited value commits.',
    'mth-reveal-change': 'Fired when plaintext visibility toggles.',
  },
  cssProperties: [
    { name: '--mth-color-surface', description: 'Input surface background.' },
    { name: '--mth-color-border', description: 'Default border color.' },
    { name: '--mth-color-border-focus', description: 'Focus outline color.' },
    { name: '--mth-color-danger', description: 'Weak strength and error color.' },
    { name: '--mth-color-warning', description: 'Fair strength color.' },
    { name: '--mth-color-info', description: 'Good strength color.' },
    { name: '--mth-color-success', description: 'Strong strength color.' },
  ],
};
