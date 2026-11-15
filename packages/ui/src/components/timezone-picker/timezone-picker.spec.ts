import type { ComponentBehaviorSpec } from '@methane-ui/spec-compiler';

export const timezonePickerSpec: ComponentBehaviorSpec = {
  tag: 'mth-timezone-picker',
  package: '@methane-ui/ui',
  conformance: ['form-control', 'overlay', 'listbox'],
  controllers: [
    'FormControlController',
    'OverlayController',
    'PositioningController',
    'ListboxController',
  ],
  focusModel: 'delegates-focus',
  states: ['open', 'disabled', 'readonly', 'dirty', 'touched', 'invalid'],
  keyboard: [
    { key: 'ArrowDown', when: 'Trigger or listbox is focused', expect: 'Opens timezone popover and navigates options' },
    { key: 'Enter', when: 'Timezone option is active', expect: 'Selects active IANA timezone and closes popover' },
    { key: 'Escape', when: 'Timezone popover is open', expect: 'Closes popover and restores focus' },
  ],
  props: [
    { name: 'value', attr: 'value', type: 'string', default: '' },
    { name: 'name', attr: 'name', type: 'string', default: '' },
    { name: 'label', attr: 'label', type: 'string', default: '' },
    { name: 'placeholder', attr: 'placeholder', type: 'string', default: '' },
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
    { name: 'base', description: 'Root timezone picker container.' },
    { name: 'label', description: 'Optional field label.' },
    { name: 'control', description: 'Trigger / combobox input row.' },
    { name: 'input', description: 'Searchable timezone filter input.' },
    { name: 'trigger', description: 'Dropdown toggle button.' },
    { name: 'popover', description: 'Floating timezone options container.' },
    { name: 'listbox', description: 'WAI-ARIA listbox container.' },
    { name: 'option', description: 'Selectable IANA timezone option.' },
  ],
  messages: {
    chooseTimezone: 'Choose timezone',
    searchPlaceholder: 'Filter timezones',
  },
};

export const CEM_METADATA = {
  description: 'Form-associated IANA timezone selector powered by `Intl.supportedValuesOf("timeZone")`, UTC offset formatting, and `ListboxController`.',
  propDescriptions: {
    value: 'Selected IANA timezone identifier (e.g. `America/New_York` or `UTC`).',
    name: 'Form field name.',
    label: 'Accessible field label.',
    placeholder: 'Placeholder shown when no timezone is selected.',
    open: 'Whether the timezone listbox popover is open.',
    disabled: 'Disables interaction.',
    readonly: 'Prevents changing the selected timezone.',
    required: 'Marks a timezone selection as required.',
  },
  eventDescriptions: {
    'mth-change': 'Fired when the selected timezone changes.',
    'mth-open': 'Cancelable event fired before opening.',
    'mth-after-open': 'Fired after opening completes.',
    'mth-close': 'Fired on close.',
    'mth-after-close': 'Fired after close completes.',
  },
  cssProperties: [
    { name: '--mth-color-accent', description: 'Selected option background.' },
    { name: '--mth-color-surface-raised', description: 'Floating listbox background.' },
  ],
};
