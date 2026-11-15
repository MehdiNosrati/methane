import type { ComponentBehaviorSpec } from '@methane-ui/spec-compiler';

export const signaturePadSpec: ComponentBehaviorSpec = {
  tag: 'mth-signature-pad',
  package: '@methane-ui/ui',
  conformance: ['form-control'],
  controllers: ['FormControlController'],
  focusModel: 'delegates-focus',
  states: ['disabled', 'readonly', 'dirty', 'touched', 'invalid'],
  keyboard: [
    { key: 'Enter', when: 'Signature canvas or typed signature input is focused', expect: 'Records typed or drawn signature value' },
    { key: 'Space', when: 'Undo or Clear button is focused', expect: 'Reverts last stroke or clears the signature pad' },
  ],
  props: [
    { name: 'value', attr: 'value', type: 'string', default: '' },
    { name: 'name', attr: 'name', type: 'string', default: '' },
    { name: 'label', attr: 'label', type: 'string', default: '' },
    { name: 'penColor', attr: 'pen-color', type: 'string', default: '' },
    { name: 'penWidth', attr: 'pen-width', type: 'number', default: 2 },
    { name: 'disabled', attr: 'disabled', type: 'boolean', default: false },
    { name: 'readonly', attr: 'readonly', type: 'boolean', default: false },
    { name: 'required', attr: 'required', type: 'boolean', default: false },
  ],
  events: [{ name: 'mth-change', cancelable: false, detailType: '{ value: string; isEmpty: boolean }' }],
  slots: [],
  parts: [
    { name: 'base', description: 'Root signature pad container.' },
    { name: 'label', description: 'Optional field label.' },
    { name: 'canvas', description: 'Pointer-capture drawing canvas.' },
    { name: 'typed-input', description: 'Accessible keyboard typed signature fallback input.' },
    { name: 'actions', description: 'Undo and clear toolbar.' },
    { name: 'undo-button', description: 'Button to undo last stroke.' },
    { name: 'clear-button', description: 'Button to clear signature.' },
  ],
  messages: {
    canvasLabel: 'Signature drawing area',
    typedPlaceholder: 'Or type signature',
    undo: 'Undo',
    clear: 'Clear',
    requiredError: 'Signature is required',
  },
};

export const CEM_METADATA = {
  description: 'Form-associated pointer-capture signature pad with undo/clear controls and keyboard typed-signature fallback.',
  propDescriptions: {
    value: 'Serialized signature payload (PNG data URL or typed signature string).',
    name: 'Form field name.',
    label: 'Accessible field label.',
    penColor: 'Optional stroke CSS color (defaults to current text color).',
    penWidth: 'Stroke width in pixels.',
    disabled: 'Disables drawing and controls.',
    readonly: 'Prevents modifying the signature.',
    required: 'Marks a signature as required.',
  },
  eventDescriptions: {
    'mth-change': 'Fired when strokes change or signature is cleared.',
  },
  cssProperties: [
    { name: '--mth-color-surface', description: 'Canvas surface background.' },
    { name: '--mth-color-border', description: 'Canvas border color.' },
    { name: '--mth-color-fg', description: 'Default ink stroke color.' },
  ],
};
