import type { ComponentBehaviorSpec } from '@methane/spec-compiler';

export const rruleEditorSpec: ComponentBehaviorSpec = {
  tag: 'mth-rrule-editor',
  package: '@methane/ui',
  conformance: ['form-control'],
  controllers: ['FormControlController'],
  focusModel: 'delegates-focus',
  states: ['disabled', 'required', 'readonly', 'invalid'],
  keyboard: [
    {
      key: 'ArrowDown',
      when: 'Frequency or end-mode select is focused',
      expect: 'Navigates available recurrence options',
    },
  ],
  props: [
    { name: 'value', attr: 'value', type: 'string', default: '' },
    { name: 'name', attr: 'name', type: 'string', default: '' },
    { name: 'label', attr: 'label', type: 'string', default: '' },
    { name: 'hint', attr: 'hint', type: 'string', default: '' },
    { name: 'error', attr: 'error', type: 'string', default: '' },
    { name: 'dtstart', attr: 'dtstart', type: 'string', default: '' },
    { name: 'disabled', attr: 'disabled', type: 'boolean', default: false },
    { name: 'required', attr: 'required', type: 'boolean', default: false },
    { name: 'readonly', attr: 'readonly', type: 'boolean', default: false },
  ],
  events: [
    { name: 'mth-input', cancelable: false, detailType: '{ value: string }' },
    { name: 'mth-change', cancelable: false, detailType: '{ value: string }' },
  ],
  slots: [
    { name: 'label', description: 'Optional custom label.' },
    { name: 'hint', description: 'Optional helper text.' },
    { name: 'error', description: 'Optional validation error text.' },
  ],
  parts: [
    { name: 'base', description: 'Outer recurrence editor container.' },
    { name: 'label', description: 'Field label.' },
    { name: 'frequency', description: 'Frequency `<select>` control.' },
    { name: 'interval', description: 'Repeat interval numeric input.' },
    { name: 'weekdays', description: 'Weekly day-of-week toggle group.' },
    { name: 'weekday', description: 'Weekday toggle button (`MO`..`SU`).' },
    { name: 'end-mode', description: 'Recurrence termination mode `<select>`.' },
    { name: 'count', description: 'Occurrence count numeric input.' },
    { name: 'until', description: 'End date `<input type="date">`.' },
    { name: 'rule', description: 'Serialized RFC 5545 RRULE summary readout.' },
    { name: 'preview', description: 'Expanded upcoming occurrence dates when `dtstart` is set.' },
    { name: 'hint', description: 'Helper text container.' },
    { name: 'error', description: 'Validation error message container.' },
  ],
  messages: {
    label: 'Recurrence rule',
    frequencyLabel: 'Frequency',
    none: 'Does not repeat',
    daily: 'Daily',
    weekly: 'Weekly',
    monthly: 'Monthly',
    yearly: 'Yearly',
  },
};

export const CEM_METADATA = {
  description:
    'Form-associated RFC 5545 recurrence rule (`RRULE`) builder integrating `FormControlController`, `expandRRule` occurrence preview, and strict same-root shadow ARIA.',
  propDescriptions: {
    value: 'Serialized RFC 5545 RRULE string (e.g. `FREQ=WEEKLY;INTERVAL=2;BYDAY=MO,FR`).',
    name: 'Form field name submitted via `ElementInternals`.',
    label: 'Accessible editor label.',
    hint: 'Supplementary helper text.',
    error: 'Explicit custom validation error message.',
    dtstart: 'Optional start date (`YYYY-MM-DD`) used by `expandRRule` to preview upcoming occurrences.',
    disabled: 'Disables all interactive rule controls.',
    required: 'Marks a recurrence rule as required for form validation.',
    readonly: 'Prevents edits while preserving form participation and focusability.',
  },
  eventDescriptions: {
    'mth-input': 'Emitted immediately when any rule parameter changes.',
    'mth-change': 'Emitted when the rule value commits.',
  },
  cssProperties: [
    { name: '--mth-color-surface', description: 'Control background color.' },
    { name: '--mth-color-border', description: 'Border color.' },
    { name: '--mth-color-accent', description: 'Active weekday pill background.' },
    { name: '--mth-color-accent-fg', description: 'Active weekday pill foreground.' },
  ],
};
