import type { ComponentBehaviorSpec } from '@methane/spec-compiler';
import { radioGroupMessages } from './radio-group.messages.js';

export const radioGroupSpec: ComponentBehaviorSpec = {
  tag: 'mth-radio-group',
  package: '@methane/ui',
  conformance: ['form-control', 'roving-focus'],
  controllers: [
    'FormControlController',
    'RovingFocusController',
    'SelectionController',
    'SlotCollectionController',
    'ContextProtocol',
  ],
  focusModel: 'none',
  states: ['dirty', 'touched', 'user-invalid', 'disabled', 'required'],
  keyboard: [
    { key: 'ArrowDown', when: 'vertical orientation', expect: 'roves focus to next enabled radio and selects it' },
    { key: 'ArrowUp', when: 'vertical orientation', expect: 'roves focus to previous enabled radio and selects it' },
    { key: 'ArrowRight', dir: 'ltr', when: 'horizontal orientation in LTR', expect: 'roves focus to next enabled radio and selects it' },
    { key: 'ArrowLeft', dir: 'ltr', when: 'horizontal orientation in LTR', expect: 'roves focus to previous enabled radio and selects it' },
    { key: 'ArrowLeft', dir: 'rtl', when: 'horizontal orientation in RTL', expect: 'roves focus to next enabled radio and selects it' },
    { key: 'ArrowRight', dir: 'rtl', when: 'horizontal orientation in RTL', expect: 'roves focus to previous enabled radio and selects it' },
    { key: 'Home', when: 'any orientation', expect: 'moves focus and selection to first enabled radio' },
    { key: 'End', when: 'any orientation', expect: 'moves focus and selection to last enabled radio' },
  ],
  props: [
    { name: 'value', attr: 'value', type: 'string', default: '' },
    { name: 'name', attr: 'name', type: 'string', default: '' },
    { name: 'label', attr: 'label', type: 'string', default: '' },
    { name: 'hint', attr: 'hint', type: 'string', default: '' },
    { name: 'error', attr: 'error', type: 'string', default: '' },
    {
      name: 'orientation',
      attr: 'orientation',
      type: "'horizontal' | 'vertical'",
      default: 'vertical',
    },
    { name: 'disabled', attr: 'disabled', type: 'boolean', default: false },
    { name: 'required', attr: 'required', type: 'boolean', default: false },
  ],
  events: [
    { name: 'mth-change', cancelable: false, detailType: '{ value: string }' },
  ],
  slots: [
    { name: '', description: 'Slotted `<mth-radio>` options.' },
    { name: 'label', description: 'Optional group label slot mirrored inside shadow root.' },
    { name: 'hint', description: 'Helper text slot mirrored inside shadow root.' },
    { name: 'error', description: 'Validation error slot mirrored inside shadow root.' },
  ],
  parts: [
    { name: 'base', description: 'Outer radio group wrapper.' },
    { name: 'label', description: 'Internal same-root group label element.' },
    { name: 'group', description: 'Container with `role="radiogroup"` housing slotted radios.' },
    { name: 'hint', description: 'Hint message container.' },
    { name: 'error', description: 'Validation error message container.' },
  ],
  messages: { ...radioGroupMessages },
};

export const CEM_METADATA = {
  description:
    'Form-associated radio group coordinating `<mth-radio>` children with APG roving focus, arrow selection, FACE validation, same-root ARIA, and FieldContext.',
  propDescriptions: {
    value: 'Currently selected radio value.',
    name: 'Form submission field name.',
    label: 'Accessible group label rendered inside shadow root.',
    hint: 'Helper text linked via aria-describedby inside shadow root.',
    error: 'Explicit custom error message displayed inside shadow root.',
    orientation: 'Layout and arrow navigation axis (`horizontal | vertical`).',
    disabled: 'Disables all radios in the group.',
    required: 'Marks selection required for constraint validation.',
  },
  eventDescriptions: {
    'mth-change': 'Emitted when selected radio value changes.',
  },
  cssProperties: [
    { name: '--mth-color-fg', description: 'Label text color.' },
    { name: '--mth-color-fg-muted', description: 'Hint text color.' },
    { name: '--mth-color-danger', description: 'Error text color.' },
    { name: '--mth-space-2', description: 'Gap between radio options.' },
  ],
};
