import type { ComponentBehaviorSpec } from '@methane/spec-compiler';

export const cronBuilderSpec: ComponentBehaviorSpec = {
  tag: 'mth-cron-builder',
  package: '@methane/ui',
  conformance: ['form-control'],
  controllers: ['FormControlController'],
  focusModel: 'delegates-focus',
  states: ['disabled', 'readonly', 'dirty', 'touched', 'invalid'],
  keyboard: [
    { key: 'Enter', when: 'Preset button is focused', expect: 'Applies preset 5-field cron expression' },
    { key: 'Tab', when: 'Moving across cron fields', expect: 'Moves focus sequentially across minute, hour, day, month, and weekday inputs' },
  ],
  props: [
    { name: 'value', attr: 'value', type: 'string', default: '0 * * * *' },
    { name: 'name', attr: 'name', type: 'string', default: '' },
    { name: 'label', attr: 'label', type: 'string', default: '' },
    { name: 'disabled', attr: 'disabled', type: 'boolean', default: false },
    { name: 'readonly', attr: 'readonly', type: 'boolean', default: false },
    { name: 'required', attr: 'required', type: 'boolean', default: false },
  ],
  events: [{ name: 'mth-change', cancelable: false, detailType: '{ value: string }' }],
  slots: [],
  parts: [
    { name: 'base', description: 'Root cron builder container.' },
    { name: 'label', description: 'Optional field label.' },
    { name: 'presets', description: 'Quick cron preset button bar.' },
    { name: 'preset', description: 'Individual preset trigger button.' },
    { name: 'fields', description: 'Five-field cron input grid.' },
    { name: 'field', description: 'Individual cron segment wrapper.' },
    { name: 'field-label', description: 'Cron segment label.' },
    { name: 'field-input', description: 'Cron segment text input.' },
    { name: 'summary', description: 'Human-readable schedule summary.' },
  ],
  messages: {
    minute: 'Minute',
    hour: 'Hour',
    dayOfMonth: 'Day (month)',
    month: 'Month',
    dayOfWeek: 'Day (week)',
    presetsLabel: 'Quick presets',
    invalidExpression: 'Enter a valid 5-part cron expression',
    summaryPrefix: 'Schedule:',
  },
};

export const CEM_METADATA = {
  description: 'Form-associated 5-field cron expression builder with quick presets and human-readable schedule summary.',
  propDescriptions: {
    value: 'Five-field cron expression string (minute hour day-of-month month day-of-week).',
    name: 'Form field name.',
    label: 'Accessible field label.',
    disabled: 'Disables interaction.',
    readonly: 'Prevents editing cron fields or applying presets.',
    required: 'Marks a cron expression as required.',
  },
  eventDescriptions: {
    'mth-change': 'Fired when the cron expression changes.',
  },
  cssProperties: [
    { name: '--mth-color-surface', description: 'Input and preset background.' },
    { name: '--mth-color-accent', description: 'Active preset highlight color.' },
    { name: '--mth-color-border', description: 'Container border color.' },
  ],
};
