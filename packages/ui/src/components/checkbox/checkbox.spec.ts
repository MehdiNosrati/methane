import type { ComponentBehaviorSpec } from '@methane-ui/spec-compiler';
import { checkboxMessages } from './checkbox.messages.js';

export const checkboxSpec: ComponentBehaviorSpec = {
  tag: 'mth-checkbox',
  package: '@methane-ui/ui',
  conformance: ['form-control'],
  controllers: ['FormControlController', 'ContextProtocol'],
  focusModel: 'delegates-focus',
  states: ['checked', 'indeterminate', 'dirty', 'touched', 'user-invalid', 'disabled', 'required', 'readonly'],
  keyboard: [
    { key: ' ', when: 'focused and not disabled or readonly', expect: 'toggles checked state and clears indeterminate' },
  ],
  props: [
    { name: 'checked', attr: 'checked', type: 'boolean', default: false },
    { name: 'indeterminate', attr: 'indeterminate', type: 'boolean', default: false },
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
    {
      name: 'mth-change',
      cancelable: false,
      detailType: '{ checked: boolean; indeterminate: boolean; value: string }',
    },
  ],
  slots: [
    { name: '', description: 'Checkbox label content.' },
    { name: 'hint', description: 'Helper text slot mirrored inside shadow root.' },
    { name: 'error', description: 'Validation error slot mirrored inside shadow root.' },
  ],
  parts: [
    { name: 'base', description: 'Outer checkbox field wrapper.' },
    { name: 'row', description: 'Horizontal alignment row for indicator and label.' },
    { name: 'control', description: 'Interactive checkbox indicator button.' },
    { name: 'indicator', description: 'Checkmark or indeterminate glyph.' },
    { name: 'label', description: 'Internal same-root shadow `<label>` element.' },
    { name: 'hint', description: 'Hint message container.' },
    { name: 'error', description: 'Validation error message container.' },
  ],
  messages: { ...checkboxMessages },
};

export const CEM_METADATA = {
  description:
    'Tri-state form-associated checkbox supporting checked/indeterminate custom states, FACE validation, same-root ARIA, and FieldContext.',
  propDescriptions: {
    checked: 'Whether the checkbox is checked.',
    indeterminate: 'Mixed visual and ARIA state (`aria-checked="mixed"`).',
    value: 'Form value submitted when checked (defaults to `"on"`).',
    name: 'Form submission field name.',
    label: 'Accessible label when default slot is omitted.',
    hint: 'Helper text linked via aria-describedby inside shadow root.',
    error: 'Explicit custom error message displayed inside shadow root.',
    disabled: 'Disables checkbox interaction.',
    required: 'Marks checkbox required for constraint validation.',
    readonly: 'Prevents toggling while remaining focusable and submittable.',
  },
  eventDescriptions: {
    'mth-change': 'Emitted when checked state toggles via user interaction.',
  },
  cssProperties: [
    { name: '--mth-color-surface', description: 'Unchecked box background color.' },
    { name: '--mth-color-accent', description: 'Checked/indeterminate box fill color.' },
    { name: '--mth-color-accent-fg', description: 'Checkmark glyph color.' },
    { name: '--mth-color-border', description: 'Checkbox border color.' },
    { name: '--mth-color-border-focus', description: 'Focus ring color.' },
    { name: '--mth-color-danger', description: 'Invalid border and error color.' },
    { name: '--mth-radius-sm', description: 'Checkbox corner radius.' },
  ],
};
