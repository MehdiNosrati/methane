import type { ComponentBehaviorSpec } from '@methane/spec-compiler';

export const datetimePickerSpec: ComponentBehaviorSpec = {
  tag: 'mth-datetime-picker',
  package: '@methane/ui',
  conformance: ['form-control', 'overlay'],
  controllers: [
    'CalendarCore',
    'FormControlController',
    'OverlayController',
    'PositioningController',
  ],
  focusModel: 'delegates-focus',
  states: ['open', 'disabled', 'readonly', 'dirty', 'touched', 'invalid'],
  keyboard: [
    { key: 'ArrowDown', when: 'Trigger or input is focused', expect: 'Opens datetime popover' },
    { key: 'Escape', when: 'Datetime popover is open', expect: 'Closes popover and restores focus' },
  ],
  props: [
    { name: 'value', attr: 'value', type: 'string', default: '' },
    { name: 'name', attr: 'name', type: 'string', default: '' },
    { name: 'label', attr: 'label', type: 'string', default: '' },
    { name: 'placeholder', attr: 'placeholder', type: 'string', default: 'YYYY-MM-DDTHH:MM' },
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
    { name: 'base', description: 'Root datetime picker container.' },
    { name: 'label', description: 'Optional field label.' },
    { name: 'control', description: 'Input + trigger wrapper.' },
    { name: 'input', description: 'ISO datetime input (`YYYY-MM-DDTHH:MM`).' },
    { name: 'trigger', description: 'Popover toggle button.' },
    { name: 'popover', description: 'Combined calendar and time dialog.' },
    { name: 'day', description: 'Calendar day button.' },
    { name: 'time-input', description: 'Time part selector inside popover.' },
  ],
  messages: {
    chooseDatetime: 'Choose date and time',
    previousMonth: 'Previous month',
    nextMonth: 'Next month',
    timeLabel: 'Time',
    apply: 'Done',
  },
};

export const CEM_METADATA = {
  description: 'Combined date and time picker outputting ISO `YYYY-MM-DDTHH:MM` values with `CalendarCore` and time selection.',
  propDescriptions: {
    value: 'ISO local datetime value (`YYYY-MM-DDTHH:MM`).',
    name: 'Form field name.',
    label: 'Accessible field label.',
    placeholder: 'Input placeholder text.',
    open: 'Whether the datetime popover is open.',
    disabled: 'Disables interaction.',
    readonly: 'Prevents changing the datetime.',
    required: 'Marks a datetime value as required.',
  },
  eventDescriptions: {
    'mth-change': 'Fired when date or time changes.',
    'mth-open': 'Cancelable event fired before opening.',
    'mth-after-open': 'Fired after opening.',
    'mth-close': 'Fired on close.',
    'mth-after-close': 'Fired after close completes.',
  },
  cssProperties: [
    { name: '--mth-color-accent', description: 'Selected day highlight color.' },
    { name: '--mth-color-surface-raised', description: 'Popover surface background.' },
  ],
};
