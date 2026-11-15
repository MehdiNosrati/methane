import type { ComponentBehaviorSpec } from '@methane/spec-compiler';

export const timePickerSpec: ComponentBehaviorSpec = {
  tag: 'mth-time-picker',
  package: '@methane/ui',
  conformance: ['form-control', 'overlay'],
  controllers: ['FormControlController', 'OverlayController', 'PositioningController'],
  focusModel: 'delegates-focus',
  states: ['open', 'disabled', 'readonly', 'dirty', 'touched', 'invalid'],
  keyboard: [
    { key: 'ArrowDown', when: 'Trigger or input is focused', expect: 'Opens time options popover' },
    { key: 'Escape', when: 'Time popover is open', expect: 'Closes popover and restores focus' },
  ],
  props: [
    { name: 'value', attr: 'value', type: 'string', default: '' },
    { name: 'name', attr: 'name', type: 'string', default: '' },
    { name: 'label', attr: 'label', type: 'string', default: '' },
    { name: 'placeholder', attr: 'placeholder', type: 'string', default: 'HH:MM' },
    { name: 'stepMinutes', attr: 'step-minutes', type: 'number', default: 30 },
    { name: 'use12Hour', attr: 'use-12-hour', type: 'boolean', default: false },
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
    { name: 'base', description: 'Root time picker container.' },
    { name: 'label', description: 'Optional visible field label.' },
    { name: 'control', description: 'Input + trigger group.' },
    { name: 'input', description: '24h/12h time text input.' },
    { name: 'trigger', description: 'Clock popover toggle button.' },
    { name: 'popover', description: 'Floating time slot listbox container.' },
    { name: 'option', description: 'Selectable time option button.' },
  ],
  messages: {
    chooseTime: 'Choose time',
    timeOptions: 'Time options',
  },
};

export const CEM_METADATA = {
  description: 'Form-associated time picker with 12h/24h formatting, configurable minute steps, and floating option list.',
  propDescriptions: {
    value: 'Selected time string in `HH:MM` 24-hour format.',
    name: 'Form control field name.',
    label: 'Accessible field label.',
    placeholder: 'Placeholder shown when empty.',
    stepMinutes: 'Interval between generated time options in minutes.',
    use12Hour: 'Formats time options in localized 12-hour AM/PM style.',
    open: 'Whether the time options popover is open.',
    disabled: 'Disables interaction and submission.',
    readonly: 'Prevents changing the selected time.',
    required: 'Marks a time selection as required.',
  },
  eventDescriptions: {
    'mth-change': 'Fired when the selected time changes.',
    'mth-open': 'Cancelable event fired before opening the popover.',
    'mth-after-open': 'Fired after opening completes.',
    'mth-close': 'Fired when the popover closes.',
    'mth-after-close': 'Fired after closing and focus restore complete.',
  },
  cssProperties: [
    { name: '--mth-color-accent', description: 'Selected option background.' },
    { name: '--mth-color-surface-raised', description: 'Popover surface background.' },
  ],
};
