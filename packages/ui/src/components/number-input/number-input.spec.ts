import type { ComponentBehaviorSpec } from '@methane-ui/spec-compiler';
import { numberInputMessages } from './number-input.messages.js';

export const numberInputSpec: ComponentBehaviorSpec = {
  tag: 'mth-number-input',
  package: '@methane-ui/ui',
  conformance: ['form-control'],
  controllers: ['FormControlController', 'InputController', 'ContextProtocol'],
  focusModel: 'delegates-focus',
  states: ['dirty', 'touched', 'user-invalid', 'disabled', 'required', 'readonly'],
  keyboard: [
    { key: 'ArrowUp', when: 'spinbutton focused and not disabled/readonly', expect: 'increments value by step' },
    { key: 'ArrowDown', when: 'spinbutton focused and not disabled/readonly', expect: 'decrements value by step' },
    { key: 'Home', when: 'spinbutton focused and min defined', expect: 'sets value to min' },
    { key: 'End', when: 'spinbutton focused and max defined', expect: 'sets value to max' },
  ],
  props: [
    { name: 'value', attr: 'value', type: 'string', default: '' },
    { name: 'name', attr: 'name', type: 'string', default: '' },
    { name: 'label', attr: 'label', type: 'string', default: '' },
    { name: 'hint', attr: 'hint', type: 'string', default: '' },
    { name: 'error', attr: 'error', type: 'string', default: '' },
    { name: 'placeholder', attr: 'placeholder', type: 'string', default: '' },
    { name: 'min', attr: 'min', type: 'number | undefined' },
    { name: 'max', attr: 'max', type: 'number | undefined' },
    { name: 'step', attr: 'step', type: 'number', default: 1 },
    { name: 'locale', attr: 'locale', type: 'string', default: '' },
    { name: 'disabled', attr: 'disabled', type: 'boolean', default: false },
    { name: 'required', attr: 'required', type: 'boolean', default: false },
    { name: 'readonly', attr: 'readonly', type: 'boolean', default: false },
  ],
  events: [
    { name: 'mth-input', cancelable: false, detailType: '{ value: string; valueAsNumber: number }' },
    { name: 'mth-change', cancelable: false, detailType: '{ value: string; valueAsNumber: number }' },
  ],
  slots: [
    { name: 'label', description: 'Optional accessible label slot.' },
    { name: 'hint', description: 'Helper text slot.' },
    { name: 'error', description: 'Error text slot.' },
  ],
  parts: [
    { name: 'base', description: 'Outer field stack.' },
    { name: 'label', description: 'Shadow `<label>` element.' },
    { name: 'wrapper', description: 'Stepper input container.' },
    { name: 'decrement', description: 'Decrement stepper button.' },
    { name: 'control', description: 'Spinbutton `<input>` element.' },
    { name: 'increment', description: 'Increment stepper button.' },
    { name: 'hint', description: 'Hint message container.' },
    { name: 'error', description: 'Error message container.' },
  ],
  messages: { ...numberInputMessages },
};

export const CEM_METADATA = {
  description:
    'Form-associated numeric spinbutton with precision-safe steppers, ArrowUp/ArrowDown keyboard control, min/max constraint validation, and Intl formatting.',
  propDescriptions: {
    value: 'Canonical string representation of the current number.',
    name: 'Form submission field name.',
    label: 'Accessible label rendered inside shadow root.',
    hint: 'Helper text displayed below control.',
    error: 'Explicit validation error message.',
    placeholder: 'Placeholder displayed when empty.',
    min: 'Minimum permitted numeric value.',
    max: 'Maximum permitted numeric value.',
    step: 'Step increment for stepper buttons and Arrow keys.',
    locale: 'BCP-47 locale used by FormattingUtils for accessible `aria-valuetext`.',
    disabled: 'Disables input and stepper buttons.',
    required: 'Marks control required.',
    readonly: 'Prevents edits and disables steppers.',
  },
  eventDescriptions: {
    'mth-input': 'Fired synchronously when numeric value updates.',
    'mth-change': 'Fired when edited or stepped value commits.',
  },
  cssProperties: [
    { name: '--mth-color-surface', description: 'Input background color.' },
    { name: '--mth-color-bg-subtle', description: 'Stepper button hover background.' },
    { name: '--mth-color-border', description: 'Border color.' },
    { name: '--mth-color-border-focus', description: 'Focus ring color.' },
    { name: '--mth-radius-md', description: 'Control corner radius.' },
  ],
};
