import type { ComponentBehaviorSpec } from '@methane-ui/spec-compiler';

export const dateRangePickerSpec: ComponentBehaviorSpec = {
  tag: 'mth-date-range-picker',
  package: '@methane-ui/ui',
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
    { key: 'ArrowDown', when: 'Trigger or input is focused', expect: 'Opens date range calendar popover' },
    { key: 'Escape', when: 'Calendar popover is open', expect: 'Closes popover and restores focus' },
  ],
  props: [
    { name: 'value', attr: 'value', type: 'string', default: '' },
    { name: 'startDate', attr: 'start-date', type: 'string', default: '' },
    { name: 'endDate', attr: 'end-date', type: 'string', default: '' },
    { name: 'name', attr: 'name', type: 'string', default: '' },
    { name: 'label', attr: 'label', type: 'string', default: '' },
    { name: 'placeholder', attr: 'placeholder', type: 'string', default: 'YYYY-MM-DD/YYYY-MM-DD' },
    { name: 'open', attr: 'open', type: 'boolean', default: false },
    { name: 'disabled', attr: 'disabled', type: 'boolean', default: false },
    { name: 'readonly', attr: 'readonly', type: 'boolean', default: false },
    { name: 'required', attr: 'required', type: 'boolean', default: false },
  ],
  events: [
    { name: 'mth-change', cancelable: false, detailType: '{ value: string; startDate: string; endDate: string }' },
    { name: 'mth-open', cancelable: true, detailType: '{ open: true }' },
    { name: 'mth-after-open', cancelable: false, detailType: '{ open: true }' },
    { name: 'mth-close', cancelable: false, detailType: '{ reason: string }' },
    { name: 'mth-after-close', cancelable: false, detailType: '{ reason: string }' },
  ],
  slots: [],
  parts: [
    { name: 'base', description: 'Root date range picker container.' },
    { name: 'label', description: 'Optional visible field label.' },
    { name: 'control', description: 'Input + trigger wrapper.' },
    { name: 'input', description: 'ISO date range input (`YYYY-MM-DD/YYYY-MM-DD`).' },
    { name: 'trigger', description: 'Range calendar popover toggle button.' },
    { name: 'popover', description: 'Floating range calendar dialog.' },
    { name: 'day', description: 'Calendar day button with range-start/in-range/range-end states.' },
  ],
  messages: {
    chooseRange: 'Choose date range',
    previousMonth: 'Previous month',
    nextMonth: 'Next month',
  },
};

export const CEM_METADATA = {
  description: 'Form-associated ISO date range picker powered by `CalendarCore({ mode: "range" })` and `FormattingUtils.formatDateRange`.',
  propDescriptions: {
    value: 'Selected range formatted as `YYYY-MM-DD/YYYY-MM-DD`.',
    startDate: 'Start date of the selected range in `YYYY-MM-DD`.',
    endDate: 'End date of the selected range in `YYYY-MM-DD`.',
    name: 'Form field name.',
    label: 'Accessible field label.',
    placeholder: 'Placeholder text when empty.',
    open: 'Whether the range calendar popover is open.',
    disabled: 'Disables interaction.',
    readonly: 'Prevents changing the selected range.',
    required: 'Marks a date range value as required.',
  },
  eventDescriptions: {
    'mth-change': 'Fired when a date range is completed or updated.',
    'mth-open': 'Cancelable event fired before opening.',
    'mth-after-open': 'Fired after opening completes.',
    'mth-close': 'Fired on close.',
    'mth-after-close': 'Fired after close completes.',
  },
  cssProperties: [
    { name: '--mth-color-accent', description: 'Range endpoint background color.' },
    { name: '--mth-color-accent-subtle', description: 'In-range span highlight background.' },
  ],
};
