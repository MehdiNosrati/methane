import type { ComponentBehaviorSpec } from '@methane-ui/spec-compiler';
import { switchMessages } from './switch.messages.js';

export const switchSpec: ComponentBehaviorSpec = {
  tag: 'mth-switch',
  package: '@methane-ui/ui',
  conformance: ['form-control'],
  controllers: ['FormControlController', 'ContextProtocol'],
  focusModel: 'delegates-focus',
  states: ['checked', 'dirty', 'touched', 'user-invalid', 'disabled', 'required', 'readonly'],
  keyboard: [
    { key: ' ', when: 'focused and not disabled or readonly', expect: 'toggles switch state' },
    { key: 'Enter', when: 'focused and not disabled or readonly', expect: 'toggles switch state' },
  ],
  props: [
    { name: 'checked', attr: 'checked', type: 'boolean', default: false },
    { name: 'value', attr: 'value', type: 'string', default: 'on' },
    { name: 'name', attr: 'name', type: 'string', default: '' },
    { name: 'label', attr: 'label', type: 'string', default: '' },
    { name: 'hint', attr: 'hint', type: 'string', default: '' },
    { name: 'error', attr: 'error', type: 'string', default: '' },
    { name: 'disabled', attr: 'disabled', type: 'boolean', default: false },
    { name: 'required', attr: 'required', type: 'boolean', default: false },
    { name: 'readonly', attr: 'readonly', type: 'boolean', default: false },
  ],
  events: [
    { name: 'mth-change', cancelable: false, detailType: '{ checked: boolean; value: string }' },
  ],
  slots: [
    { name: '', description: 'Switch label content.' },
    { name: 'hint', description: 'Helper text slot mirrored inside shadow root.' },
    { name: 'error', description: 'Validation error slot mirrored inside shadow root.' },
  ],
  parts: [
    { name: 'base', description: 'Outer switch field container.' },
    { name: 'row', description: 'Horizontal alignment row for switch track and label.' },
    { name: 'control', description: 'Interactive `<button role="switch">` track element.' },
    { name: 'thumb', description: 'Sliding visual thumb inside the switch track.' },
    { name: 'label', description: 'Internal same-root shadow `<label>` element.' },
    { name: 'hint', description: 'Hint message container.' },
    { name: 'error', description: 'Validation error message container.' },
  ],
  messages: { ...switchMessages },
};

export const CEM_METADATA = {
  description:
    'Form-associated binary toggle switch with `role="switch"`, Space/Enter activation, FACE validation, same-root ARIA, and FieldContext.',
  propDescriptions: {
    checked: 'Whether the switch is turned on.',
    value: 'Form value submitted when checked (defaults to `"on"`).',
    name: 'Form submission field name.',
    label: 'Accessible label when default slot is omitted.',
    hint: 'Helper text linked via aria-describedby inside shadow root.',
    error: 'Explicit custom error message displayed inside shadow root.',
    disabled: 'Disables switch interaction.',
    required: 'Marks switch required for constraint validation.',
    readonly: 'Prevents toggling while remaining focusable and submittable.',
  },
  eventDescriptions: {
    'mth-change': 'Emitted when the switch toggles.',
  },
  cssProperties: [
    { name: '--mth-color-border-strong', description: 'Unchecked track background color.' },
    { name: '--mth-color-accent', description: 'Checked track background color.' },
    { name: '--mth-color-surface', description: 'Thumb background color.' },
    { name: '--mth-color-border-focus', description: 'Focus ring color.' },
    { name: '--mth-color-danger', description: 'Invalid border and error color.' },
  ],
};
