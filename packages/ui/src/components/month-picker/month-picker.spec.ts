import type { ComponentBehaviorSpec } from '@methane/spec-compiler';

export const monthPickerSpec: ComponentBehaviorSpec = {
  tag: 'mth-month-picker',
  package: '@methane/ui',
  conformance: ['form-control', 'overlay', 'roving-focus'],
  controllers: [
    'FormControlController',
    'OverlayController',
    'PositioningController',
    'RovingFocusController',
  ],
  focusModel: 'delegates-focus',
  states: ['open', 'disabled', 'readonly', 'dirty', 'touched', 'invalid'],
  keyboard: [
    { key: 'ArrowRight', when: 'Month cell is focused', expect: 'Moves focus to next month (RTL-aware)' },
    { key: 'ArrowLeft', when: 'Month cell is focused', expect: 'Moves focus to previous month (RTL-aware)' },
    { key: 'ArrowDown', when: 'Month cell is focused', expect: 'Moves focus three months forward' },
    { key: 'ArrowUp', when: 'Month cell is focused', expect: 'Moves focus three months backward' },
    { key: 'Escape', when: 'Month popover is open', expect: 'Closes popover and restores focus' },
  ],
  props: [
    { name: 'value', attr: 'value', type: 'string', default: '' },
    { name: 'name', attr: 'name', type: 'string', default: '' },
    { name: 'label', attr: 'label', type: 'string', default: '' },
    { name: 'placeholder', attr: 'placeholder', type: 'string', default: 'YYYY-MM' },
    { name: 'open', attr: 'open', type: 'boolean', default: false },
    { name: 'disabled', attr: 'disabled', type: 'boolean', default: false },
    { name: 'readonly', attr: 'readonly', type: 'boolean', default: false },
    { name: 'required', attr: 'required', type: 'boolean', default: false },
  ],
  events: [
    { name: 'mth-change', cancelable: false, detailType: '{ value: string }' },
    { name: 'mth-open', cancelable: true, detailType: '{ open: true }' },
    { name: 'mth-after-open', cancelable: false, detailType: '{ open: true }' },
    { name: 'mth-close', cancelable: false, detailType: '{ reason: string }' },
    { name: 'mth-after-close', cancelable: false, detailType: '{ reason: string }' },
  ],
  slots: [],
  parts: [
    { name: 'base', description: 'Root month picker container.' },
    { name: 'label', description: 'Optional visible field label.' },
    { name: 'control', description: 'Input + trigger wrapper.' },
    { name: 'input', description: 'ISO month input (`YYYY-MM`).' },
    { name: 'trigger', description: 'Month popover toggle button.' },
    { name: 'popover', description: 'Floating 12-month grid dialog.' },
    { name: 'month', description: 'Selectable month button.' },
  ],
  messages: {
    chooseMonth: 'Choose month',
    previousYear: 'Previous year',
    nextYear: 'Next year',
  },
};

export const CEM_METADATA = {
  description: 'Form-associated `YYYY-MM` month picker with year stepper and 3x4 roving-focus month grid.',
  propDescriptions: {
    value: 'Selected month in `YYYY-MM` format.',
    name: 'Form field name.',
    label: 'Accessible field label.',
    placeholder: 'Placeholder shown when empty.',
    open: 'Whether the month grid popover is open.',
    disabled: 'Disables interaction.',
    readonly: 'Prevents changing the selected month.',
    required: 'Marks a month selection as required.',
  },
  eventDescriptions: {
    'mth-change': 'Fired when the selected month changes.',
    'mth-open': 'Cancelable event fired before opening.',
    'mth-after-open': 'Fired after opening.',
    'mth-close': 'Fired on close.',
    'mth-after-close': 'Fired after close completes.',
  },
  cssProperties: [
    { name: '--mth-color-accent', description: 'Selected month button highlight.' },
    { name: '--mth-color-surface-raised', description: 'Popover surface background.' },
  ],
};
