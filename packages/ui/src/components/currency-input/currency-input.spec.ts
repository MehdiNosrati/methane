import type { ComponentBehaviorSpec } from '@methane-ui/spec-compiler';
import { currencyInputMessages } from './currency-input.messages.js';

export const currencyInputSpec: ComponentBehaviorSpec = {
  tag: 'mth-currency-input',
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
    { name: 'placeholder', attr: 'placeholder', type: 'string', default: '' },
    { name: 'currency', attr: 'currency', type: 'string', default: 'USD' },
    { name: 'locale', attr: 'locale', type: 'string', default: '' },
    { name: 'decimals', attr: 'decimals', type: 'number', default: 2 },
    { name: 'allowNegative', attr: 'allow-negative', type: 'boolean', default: false },
    { name: 'min', attr: 'min', type: 'number | undefined' },
    { name: 'max', attr: 'max', type: 'number | undefined' },
    { name: 'disabled', attr: 'disabled', type: 'boolean', default: false },
    { name: 'required', attr: 'required', type: 'boolean', default: false },
    { name: 'readonly', attr: 'readonly', type: 'boolean', default: false },
  ],
  events: [
    { name: 'mth-input', cancelable: false, detailType: '{ value: string; valueAsNumber: number; currency: string }' },
    { name: 'mth-change', cancelable: false, detailType: '{ value: string; valueAsNumber: number; currency: string }' },
  ],
  slots: [
    { name: 'label', description: 'Optional accessible label slot.' },
    { name: 'hint', description: 'Helper text slot.' },
    { name: 'error', description: 'Error text slot.' },
    { name: 'suffix', description: 'Trailing adornment after the numeric input.' },
  ],
  parts: [
    { name: 'base', description: 'Outer field stack.' },
    { name: 'label', description: 'Shadow `<label>` element.' },
    { name: 'wrapper', description: 'Input box chrome.' },
    { name: 'currency', description: 'Localized currency symbol/code adornment.' },
    { name: 'control', description: 'Formatted `<input>` element.' },
    { name: 'hint', description: 'Hint message container.' },
    { name: 'error', description: 'Error message container.' },
  ],
  messages: { ...currencyInputMessages },
};

export const CEM_METADATA = {
  description:
    'Form-associated locale-aware monetary input backed by `Intl.NumberFormat`, `FormattingUtils`, and `MaskAndFormatEngine` numeric grouping.',
  propDescriptions: {
    value: 'Canonical unmasked numeric string (e.g. `"1234.56"`).',
    name: 'Form submission field name.',
    label: 'Accessible label rendered inside shadow root.',
    hint: 'Helper text displayed below control.',
    error: 'Explicit custom error message.',
    placeholder: 'Placeholder shown when empty.',
    currency: 'ISO-4217 3-letter currency code (e.g. `"USD"`, `"EUR"`, `"JPY"`).',
    locale: 'BCP-47 locale identifier used for separators and currency symbol.',
    decimals: 'Maximum fractional decimal digits allowed.',
    allowNegative: 'Allows leading minus sign.',
    min: 'Minimum valid monetary amount.',
    max: 'Maximum valid monetary amount.',
    disabled: 'Disables user interaction.',
    required: 'Marks field required.',
    readonly: 'Prevents edits while allowing focus and submission.',
  },
  eventDescriptions: {
    'mth-input': 'Fired synchronously when the monetary amount changes.',
    'mth-change': 'Fired when the edited monetary amount commits.',
  },
  cssProperties: [
    { name: '--mth-color-surface', description: 'Input surface background.' },
    { name: '--mth-color-fg-muted', description: 'Currency symbol color.' },
    { name: '--mth-color-border', description: 'Default border color.' },
    { name: '--mth-color-border-focus', description: 'Focus outline color.' },
    { name: '--mth-radius-md', description: 'Input corner radius.' },
  ],
};
