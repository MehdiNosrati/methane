import type { ComponentBehaviorSpec } from '@methane/spec-compiler';
import { availabilityPickerMessages } from './availability-picker.messages.js';

export const availabilityPickerSpec: ComponentBehaviorSpec = {
  tag: 'mth-availability-picker',
  package: '@methane/admin',
  conformance: ['form-control', 'roving-focus'],
  controllers: ['FormControlController', 'RovingFocusController'],
  focusModel: 'delegates-focus',
  states: ['disabled', 'readonly', 'required', 'invalid', 'user-invalid'],
  keyboard: [
    { key: 'ArrowRight', when: 'availability matrix has focus', expect: 'moves to next slot (or previous in RTL)' },
    { key: 'ArrowLeft', when: 'availability matrix has focus', expect: 'moves to previous slot (or next in RTL)' },
    { key: 'ArrowDown', when: 'availability matrix has focus', expect: 'moves to same time slot on next day' },
    { key: 'ArrowUp', when: 'availability matrix has focus', expect: 'moves to same time slot on previous day' },
    { key: 'Space', when: 'a slot cell has focus', expect: 'toggles availability for that day and time slot' },
    { key: 'Enter', when: 'a slot cell has focus', expect: 'toggles availability for that day and time slot' },
  ],
  props: [
    { name: 'name', attr: 'name', type: 'string', default: '' },
    { name: 'value', attr: 'value', type: 'string', default: '{}' },
    { name: 'disabled', attr: 'disabled', type: 'boolean', default: false },
    { name: 'readonly', attr: 'readonly', type: 'boolean', default: false },
    { name: 'required', attr: 'required', type: 'boolean', default: false },
    { name: 'error', attr: 'error', type: 'string', default: '' },
    { name: 'days', attr: false, type: 'ReadonlyArray<AvailabilityDay>', default: undefined },
    { name: 'slots', attr: false, type: 'ReadonlyArray<string>', default: undefined },
  ],
  events: [
    {
      name: 'mth-change',
      cancelable: false,
      detailType: '{ value: string; schedule: AvailabilitySchedule }',
    },
  ],
  slots: [{ name: '', description: 'Optional schedule legend or notes slot.' }],
  parts: [
    { name: 'base', description: 'Outer availability matrix container.' },
    { name: 'matrix', description: 'Weekly day × time-slot grid.' },
    { name: 'slot-cell', description: 'Toggleable availability cell button.' },
    { name: 'error', description: 'Validation error message.' },
  ],
  messages: availabilityPickerMessages,
};

export const CEM_METADATA = {
  description:
    'Form-associated weekly recurring availability matrix (`<mth-availability-picker>`) supporting pointer click/drag painting, RTL-aware 2D keyboard navigation, and FormControlController validation.',
  propDescriptions: {
    name: 'Form field name submitted in FormData.',
    value: 'Serialized JSON schedule mapping weekday keys to arrays of enabled time slots.',
    disabled: 'Disables all matrix cells and actions.',
    readonly: 'Prevents toggling or drag-painting slots.',
    required: 'Requires at least one selected slot across the week.',
    error: 'Custom validation error text.',
    days: 'Weekday rows rendered in the matrix.',
    slots: 'Time-slot columns rendered per day.',
  },
  eventDescriptions: {
    'mth-change': 'Emitted when one or more availability slots are toggled.',
  },
  cssProperties: [
    { name: '--mth-color-surface', description: 'Surface background for matrix panel.' },
    { name: '--mth-color-bg-subtle', description: 'Inactive slot background.' },
    { name: '--mth-color-fg', description: 'Primary text color.' },
    { name: '--mth-color-fg-muted', description: 'Secondary time header color.' },
    { name: '--mth-color-border', description: 'Matrix and cell borders.' },
    { name: '--mth-color-border-focus', description: 'Keyboard focus ring color.' },
    { name: '--mth-color-accent', description: 'Selected available slot background.' },
    { name: '--mth-color-accent-fg', description: 'Selected slot foreground.' },
    { name: '--mth-color-danger', description: 'Validation error message color.' },
  ],
};
