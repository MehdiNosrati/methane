import type { ComponentBehaviorSpec } from '@methane-ui/spec-compiler';
import { creditCardInputMessages } from './credit-card-input.messages.js';

export const creditCardInputSpec: ComponentBehaviorSpec = {
  tag: 'mth-credit-card-input',
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
    { name: 'placeholder', attr: 'placeholder', type: 'string', default: '•••• •••• •••• ••••' },
    { name: 'autocomplete', attr: 'autocomplete', type: 'string', default: 'cc-number' },
    { name: 'disabled', attr: 'disabled', type: 'boolean', default: false },
    { name: 'required', attr: 'required', type: 'boolean', default: false },
    { name: 'readonly', attr: 'readonly', type: 'boolean', default: false },
  ],
  events: [
    { name: 'mth-input', cancelable: false, detailType: '{ brand: CardBrand; valid: boolean; complete: boolean }' },
    { name: 'mth-change', cancelable: false, detailType: '{ brand: CardBrand; valid: boolean; complete: boolean }' },
  ],
  slots: [
    { name: 'label', description: 'Optional accessible label slot.' },
    { name: 'hint', description: 'Helper text slot.' },
    { name: 'error', description: 'Error text slot.' },
  ],
  parts: [
    { name: 'base', description: 'Outer field stack.' },
    { name: 'label', description: 'Shadow `<label>` element.' },
    { name: 'wrapper', description: 'Input chrome container.' },
    { name: 'control', description: 'Card number `<input>` element.' },
    { name: 'brand', description: 'Detected payment card network badge.' },
    { name: 'hint', description: 'Hint message container.' },
    { name: 'error', description: 'Error message container.' },
  ],
  messages: { ...creditCardInputMessages },
};

export const CEM_METADATA = {
  description:
    'Form-associated payment card number input with BIN/IIN brand detection, grouping via `MaskAndFormatEngine`, Luhn validation, and `autocomplete="cc-number"`. Never logs raw PAN values.',
  propDescriptions: {
    value: 'Grouped card number string.',
    name: 'Form submission field name.',
    label: 'Accessible label rendered inside shadow root.',
    hint: 'Helper text displayed below control.',
    error: 'Explicit custom error message.',
    placeholder: 'Placeholder displayed when empty.',
    autocomplete: 'HTML autocomplete attribute (defaults to `cc-number`).',
    disabled: 'Disables interaction.',
    required: 'Marks control required.',
    readonly: 'Prevents edits while remaining focusable.',
  },
  eventDescriptions: {
    'mth-input': 'Fired when card digits update without echoing raw PAN in event metadata.',
    'mth-change': 'Fired when edited card number commits.',
  },
  cssProperties: [
    { name: '--mth-color-surface', description: 'Input background color.' },
    { name: '--mth-color-border', description: 'Default border color.' },
    { name: '--mth-color-border-focus', description: 'Focus outline color.' },
    { name: '--mth-radius-md', description: 'Input corner radius.' },
  ],
};
