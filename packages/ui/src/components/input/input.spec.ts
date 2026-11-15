import type { ComponentBehaviorSpec } from '@methane/spec-compiler';
import { inputMessages } from './input.messages.js';

export const inputSpec: ComponentBehaviorSpec = {
  tag: 'mth-input',
  package: '@methane/ui',
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
    {
      name: 'type',
      attr: 'type',
      type: "'text' | 'email' | 'url' | 'search' | 'tel' | 'password'",
      default: 'text',
    },
    { name: 'label', attr: 'label', type: 'string', default: '' },
    { name: 'hint', attr: 'hint', type: 'string', default: '' },
    { name: 'error', attr: 'error', type: 'string', default: '' },
    { name: 'placeholder', attr: 'placeholder', type: 'string', default: '' },
    { name: 'autocomplete', attr: 'autocomplete', type: 'string', default: '' },
    { name: 'inputmode', attr: 'inputmode', type: 'string', default: '' },
    { name: 'disabled', attr: 'disabled', type: 'boolean', default: false },
    { name: 'required', attr: 'required', type: 'boolean', default: false },
    { name: 'readonly', attr: 'readonly', type: 'boolean', default: false },
  ],
  events: [
    { name: 'mth-input', cancelable: false, detailType: '{ value: string }' },
    { name: 'mth-change', cancelable: false, detailType: '{ value: string }' },
  ],
  slots: [
    { name: 'label', description: 'Optional label slot mirrored inside shadow root.' },
    { name: 'hint', description: 'Helper text slot mirrored inside shadow root.' },
    { name: 'error', description: 'Validation error slot mirrored inside shadow root.' },
    { name: 'prefix', description: 'Leading adornment inside the input container.' },
    { name: 'suffix', description: 'Trailing adornment inside the input container.' },
    {
      name: 'input',
      description: 'Progressive Light-DOM `<input>` slot override for password-manager and autofill compatibility.',
    },
  ],
  parts: [
    { name: 'base', description: 'Outer field stack wrapper.' },
    { name: 'label', description: 'Internal same-root shadow `<label>` element.' },
    { name: 'wrapper', description: 'Input box chrome containing prefix, control, and suffix.' },
    { name: 'control', description: 'Internal `<input>` control element.' },
    { name: 'hint', description: 'Hint message container.' },
    { name: 'error', description: 'Validation error message container.' },
  ],
  messages: { ...inputMessages },
};

export const CEM_METADATA = {
  description:
    'Form-associated textual input supporting FACE validation, same-root ARIA, FieldContext, and progressive Light-DOM autofill slot.',
  propDescriptions: {
    value: 'Current string value.',
    name: 'Form submission field name.',
    type: 'Semantic input type (`text | email | url | search | tel`).',
    label: 'Accessible label rendered inside shadow root.',
    hint: 'Helper text displayed and linked via aria-describedby inside shadow root.',
    error: 'Explicit custom error message displayed inside shadow root.',
    placeholder: 'Hint displayed when empty.',
    autocomplete: 'HTML autocomplete token passed through to the underlying `<input>`.',
    inputmode: 'Virtual keyboard hint passed through to the underlying `<input>`.',
    disabled: 'Disables user interaction.',
    required: 'Marks input required for constraint validation.',
    readonly: 'Prevents edits while remaining focusable and submittable.',
  },
  eventDescriptions: {
    'mth-input': 'Fired synchronously on user input edits.',
    'mth-change': 'Fired when edited value commits.',
  },
  cssProperties: [
    { name: '--mth-color-surface', description: 'Input background color.' },
    { name: '--mth-color-border', description: 'Default border color.' },
    { name: '--mth-color-border-focus', description: 'Focused ring color.' },
    { name: '--mth-color-danger', description: 'Invalid border and error color.' },
    { name: '--mth-radius-md', description: 'Input corner radius.' },
  ],
};
