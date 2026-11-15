import type { ComponentBehaviorSpec } from '@methane/spec-compiler';
import { bookingWidgetMessages } from './booking-widget.messages.js';

export const bookingWidgetSpec: ComponentBehaviorSpec = {
  tag: 'mth-booking-widget',
  package: '@methane/admin',
  conformance: ['form-control'],
  controllers: ['FormControlController', 'CalendarCore'],
  focusModel: 'delegates-focus',
  states: ['disabled', 'readonly', 'required', 'invalid', 'user-invalid'],
  keyboard: [],
  props: [
    { name: 'name', attr: 'name', type: 'string', default: '' },
    { name: 'value', attr: 'value', type: 'string', default: '' },
    { name: 'disabled', attr: 'disabled', type: 'boolean', default: false },
    { name: 'readonly', attr: 'readonly', type: 'boolean', default: false },
    { name: 'required', attr: 'required', type: 'boolean', default: false },
    { name: 'error', attr: 'error', type: 'string', default: '' },
    { name: 'availableSlots', attr: false, type: 'ReadonlyArray<BookingDaySlots>', default: undefined },
    { name: 'defaultSlots', attr: false, type: 'ReadonlyArray<string>', default: undefined },
  ],
  events: [
    {
      name: 'mth-change',
      cancelable: false,
      detailType: '{ value: string; date: string; time: string }',
    },
    {
      name: 'mth-confirm',
      cancelable: false,
      detailType: '{ value: string; date: string; time: string }',
    },
  ],
  slots: [{ name: '', description: 'Optional service summary or policy note.' }],
  parts: [
    { name: 'base', description: 'Outer booking widget container.' },
    { name: 'calendar', description: 'Month grid date selector.' },
    { name: 'slots', description: 'Time-slot selection list.' },
    { name: 'summary', description: 'Booking summary and confirmation footer.' },
    { name: 'error', description: 'Validation error message.' },
  ],
  messages: bookingWidgetMessages,
};

export const CEM_METADATA = {
  description:
    'Form-associated date & time slot booking widget (`<mth-booking-widget>`) combining CalendarCore date selection, time-slot picking, summary confirmation, and FormControlController validation.',
  propDescriptions: {
    name: 'Form field name submitted in FormData.',
    value: 'Selected booking slot (`YYYY-MM-DDTHH:mm`).',
    disabled: 'Disables date, time-slot, and confirmation controls.',
    readonly: 'Prevents slot selection changes.',
    required: 'Marks booking slot selection as required.',
    error: 'Custom validation error text.',
    availableSlots: 'Optional per-date override slot arrays.',
    defaultSlots: 'Default time slots offered for dates without overrides.',
  },
  eventDescriptions: {
    'mth-change': 'Emitted when the selected date/time slot changes.',
    'mth-confirm': 'Emitted when the booking confirmation button is clicked.',
  },
  cssProperties: [
    { name: '--mth-color-surface', description: 'Surface background for calendar and buttons.' },
    { name: '--mth-color-bg-subtle', description: 'Subtle summary panel background.' },
    { name: '--mth-color-fg', description: 'Primary text color.' },
    { name: '--mth-color-fg-muted', description: 'Secondary label and muted date text.' },
    { name: '--mth-color-border', description: 'Borders across panes and buttons.' },
    { name: '--mth-color-border-focus', description: 'Focus ring outline color.' },
    { name: '--mth-color-accent', description: 'Selected date/slot and confirm button accent.' },
    { name: '--mth-color-accent-fg', description: 'Foreground on accented controls.' },
    { name: '--mth-color-danger', description: 'Validation error message color.' },
  ],
};
