import type { ComponentBehaviorSpec } from '@methane/spec-compiler';

export const durationInputSpec: ComponentBehaviorSpec = {
  tag: 'mth-duration-input',
  package: '@methane/ui',
  conformance: ['form-control'],
  controllers: ['FormControlController', 'InputController'],
  focusModel: 'delegates-focus',
  states: ['disabled', 'readonly', 'dirty', 'touched', 'invalid'],
  keyboard: [
    { key: 'ArrowUp', when: 'Hours, minutes, or seconds segment is focused', expect: 'Increments segment and updates ISO duration value' },
    { key: 'ArrowDown', when: 'Hours, minutes, or seconds segment is focused', expect: 'Decrements segment and updates ISO duration value' },
  ],
  props: [
    { name: 'value', attr: 'value', type: 'string', default: '' },
    { name: 'name', attr: 'name', type: 'string', default: '' },
    { name: 'label', attr: 'label', type: 'string', default: '' },
    { name: 'showSeconds', attr: 'show-seconds', type: 'boolean', default: true },
    { name: 'disabled', attr: 'disabled', type: 'boolean', default: false },
    { name: 'readonly', attr: 'readonly', type: 'boolean', default: false },
    { name: 'required', attr: 'required', type: 'boolean', default: false },
  ],
  events: [
    { name: 'mth-change', cancelable: false, detailType: '{ value: string; totalSeconds: number }' },
  ],
  slots: [],
  parts: [
    { name: 'base', description: 'Root duration control container.' },
    { name: 'label', description: 'Optional visible field label.' },
    { name: 'group', description: 'Segmented numeric duration inputs.' },
    { name: 'hours', description: 'Hours numeric input.' },
    { name: 'minutes', description: 'Minutes numeric input.' },
    { name: 'seconds', description: 'Seconds numeric input.' },
  ],
  messages: {
    durationLabel: 'Duration',
    hours: 'Hours',
    minutes: 'Minutes',
    seconds: 'Seconds',
  },
};

export const CEM_METADATA = {
  description: 'Form-associated segmented hours/minutes/seconds duration input outputting ISO 8601 `PT#H#M#S` durations.',
  propDescriptions: {
    value: 'Duration in ISO 8601 format (e.g. `PT1H30M0S`) or `HH:MM:SS`.',
    name: 'Form field name.',
    label: 'Accessible field label.',
    showSeconds: 'Displays the seconds segment.',
    disabled: 'Disables interaction.',
    readonly: 'Prevents changing duration segments.',
    required: 'Marks a non-empty duration value as required.',
  },
  eventDescriptions: {
    'mth-change': 'Fired when any duration segment changes.',
  },
  cssProperties: [
    { name: '--mth-color-border', description: 'Segment group border color.' },
    { name: '--mth-color-surface', description: 'Segment input background.' },
  ],
};
