import type { ComponentBehaviorSpec } from '@methane-ui/spec-compiler';
import { textareaMessages } from './textarea.messages.js';

export const textareaSpec: ComponentBehaviorSpec = {
  tag: 'mth-textarea',
  package: '@methane-ui/ui',
  conformance: ['form-control'],
  controllers: ['FormControlController', 'InputController', 'ContextProtocol'],
  focusModel: 'delegates-focus',
  states: ['dirty', 'touched', 'user-invalid', 'disabled', 'required', 'readonly'],
  keyboard: [],
  props: [
    { name: 'value', attr: 'value', type: 'string', default: '' },
    { name: 'name', attr: 'name', type: 'string', default: '' },
    { name: 'label', attr: 'label', type: 'string', default: '' },
    { name: 'hint', attr: 'hint', type: 'string', default: '' },
    { name: 'error', attr: 'error', type: 'string', default: '' },
    { name: 'placeholder', attr: 'placeholder', type: 'string', default: '' },
    { name: 'rows', attr: 'rows', type: 'number', default: 3 },
    { name: 'autoResize', attr: 'auto-resize', type: 'boolean', default: false },
    { name: 'maxlength', attr: 'maxlength', type: 'number | null', default: null },
    { name: 'minlength', attr: 'minlength', type: 'number | null', default: null },
    {
      name: 'resize',
      attr: 'resize',
      type: "'none' | 'vertical' | 'both'",
      default: 'vertical',
    },
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
  ],
  parts: [
    { name: 'base', description: 'Outer field stack wrapper.' },
    { name: 'label', description: 'Internal same-root shadow `<label>` element.' },
    { name: 'wrapper', description: 'Textarea border and focus ring container.' },
    { name: 'control', description: 'Internal `<textarea>` control element.' },
    { name: 'footer', description: 'Metadata row containing hint/error and character counter.' },
    { name: 'count', description: 'Character count display.' },
    { name: 'hint', description: 'Hint message container.' },
    { name: 'error', description: 'Validation error message container.' },
  ],
  messages: { ...textareaMessages },
};

export const CEM_METADATA = {
  description:
    'Form-associated multi-line textarea with auto-resize, character counter, FACE validation, same-root ARIA, and FieldContext integration.',
  propDescriptions: {
    value: 'Current string value.',
    name: 'Form submission field name.',
    label: 'Accessible label rendered inside shadow root.',
    hint: 'Helper text displayed and linked via aria-describedby inside shadow root.',
    error: 'Explicit custom error message displayed inside shadow root.',
    placeholder: 'Placeholder text displayed when empty.',
    rows: 'Visible number of text lines.',
    autoResize: 'Automatically grows block-size to fit content using an adopted stylesheet.',
    maxlength: 'Maximum allowed character length and counter limit.',
    minlength: 'Minimum required character length for validation.',
    resize: 'Resize handle behavior when autoResize is false.',
    disabled: 'Disables user interaction.',
    required: 'Marks textarea required for constraint validation.',
    readonly: 'Prevents edits while remaining focusable and submittable.',
  },
  eventDescriptions: {
    'mth-input': 'Fired synchronously on user input edits.',
    'mth-change': 'Fired when edited value commits.',
  },
  cssProperties: [
    { name: '--mth-color-surface', description: 'Textarea background color.' },
    { name: '--mth-color-border', description: 'Default border color.' },
    { name: '--mth-color-border-focus', description: 'Focused ring color.' },
    { name: '--mth-color-danger', description: 'Invalid border and error color.' },
    { name: '--mth-radius-md', description: 'Textarea corner radius.' },
  ],
};
