import type { ComponentBehaviorSpec } from '@methane/spec-compiler';

export const inlineEditSpec: ComponentBehaviorSpec = {
  tag: 'mth-inline-edit',
  package: '@methane/ui',
  conformance: ['form-control'],
  controllers: ['FormControlController', 'InputController'],
  focusModel: 'delegates-focus',
  states: ['editing', 'disabled', 'readonly', 'dirty', 'touched', 'invalid'],
  keyboard: [
    { key: 'Enter', when: 'Display trigger is focused', expect: 'Enters edit mode and focuses text input' },
    { key: 'Enter', when: 'Inline input is focused', expect: 'Commits draft value, emits mth-change, exits edit mode, and returns focus to trigger' },
    { key: 'Escape', when: 'Inline input is focused', expect: 'Discards draft, emits mth-cancel, exits edit mode, and restores focus to trigger' },
  ],
  props: [
    { name: 'value', attr: 'value', type: 'string', default: '' },
    { name: 'name', attr: 'name', type: 'string', default: '' },
    { name: 'label', attr: 'label', type: 'string', default: '' },
    { name: 'placeholder', attr: 'placeholder', type: 'string', default: '' },
    { name: 'editing', attr: 'editing', type: 'boolean', default: false },
    { name: 'disabled', attr: 'disabled', type: 'boolean', default: false },
    { name: 'readonly', attr: 'readonly', type: 'boolean', default: false },
    { name: 'required', attr: 'required', type: 'boolean', default: false },
    { name: 'submitOnBlur', attr: 'submit-on-blur', type: 'boolean', default: true },
  ],
  events: [
    { name: 'mth-edit-start', cancelable: true, detailType: '{ value: string }' },
    { name: 'mth-input', cancelable: false, detailType: '{ value: string }' },
    { name: 'mth-change', cancelable: false, detailType: '{ value: string }' },
    { name: 'mth-cancel', cancelable: false, detailType: '{ value: string }' },
  ],
  slots: [],
  parts: [
    { name: 'base', description: 'Root inline-edit container.' },
    { name: 'trigger', description: 'Focusable display button activating edit mode.' },
    { name: 'value', description: 'Display text span.' },
    { name: 'input', description: 'Inline `<input>` element active during edit mode.' },
  ],
  messages: {
    editPrompt: 'Edit value',
    emptyPlaceholder: 'Click to edit',
  },
};

export const CEM_METADATA = {
  description: 'Form-associated click-to-edit inline text field with Enter commit, Escape revert, and focus restoration.',
  propDescriptions: {
    value: 'Committed string value submitted with the parent `<form>`.',
    name: 'Form control field name.',
    label: 'Accessible label for the display trigger and inline input.',
    placeholder: 'Placeholder shown when value is empty.',
    editing: 'Whether the inline text input is currently active.',
    disabled: 'Disables activation and editing.',
    readonly: 'Prevents entering edit mode while keeping value readable.',
    required: 'Marks a non-empty value as required for FACE constraint validation.',
    submitOnBlur: 'Commits draft value automatically when the inline input loses focus.',
  },
  eventDescriptions: {
    'mth-edit-start': 'Cancelable event fired before entering edit mode.',
    'mth-input': 'Fired as the draft input text changes.',
    'mth-change': 'Fired when an edited value is committed.',
    'mth-cancel': 'Fired when editing is cancelled via Escape.',
  },
  cssProperties: [
    { name: '--mth-color-border-focus', description: 'Focus ring and active input border color.' },
    { name: '--mth-color-surface', description: 'Input background color.' },
  ],
};
