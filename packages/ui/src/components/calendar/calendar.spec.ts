import type { ComponentBehaviorSpec } from '@methane-ui/spec-compiler';

export const calendarSpec: ComponentBehaviorSpec = {
  tag: 'mth-calendar',
  package: '@methane-ui/ui',
  conformance: [],
  controllers: ['CalendarCore'],
  focusModel: 'delegates-focus',
  states: ['disabled', 'readonly'],
  keyboard: [
    {
      key: 'ArrowRight',
      when: 'Day button inside grid is focused',
      expect: 'Moves focus one day forward (or backward in RTL)',
    },
    {
      key: 'ArrowLeft',
      when: 'Day button inside grid is focused',
      expect: 'Moves focus one day backward (or forward in RTL)',
    },
    {
      key: 'ArrowDown',
      when: 'Day button inside grid is focused',
      expect: 'Moves focus down one week (+7 days)',
    },
    {
      key: 'ArrowUp',
      when: 'Day button inside grid is focused',
      expect: 'Moves focus up one week (-7 days)',
    },
    {
      key: 'Home',
      when: 'Day button inside grid is focused',
      expect: 'Moves focus to first day of current week',
    },
    {
      key: 'End',
      when: 'Day button inside grid is focused',
      expect: 'Moves focus to last day of current week',
    },
    {
      key: 'PageUp',
      when: 'Day button inside grid is focused',
      expect: 'Moves focus to previous month (or previous year with Shift)',
    },
    {
      key: 'PageDown',
      when: 'Day button inside grid is focused',
      expect: 'Moves focus to next month (or next year with Shift)',
    },
  ],
  props: [
    { name: 'value', attr: 'value', type: 'string', default: '' },
    { name: 'min', attr: 'min', type: 'string', default: '' },
    { name: 'max', attr: 'max', type: 'string', default: '' },
    { name: 'locale', attr: 'locale', type: 'string', default: '' },
    { name: 'disabled', attr: 'disabled', type: 'boolean', default: false },
    { name: 'readonly', attr: 'readonly', type: 'boolean', default: false },
    { name: 'isDateDisabled', attr: false, type: '((iso: string) => boolean) | undefined', default: undefined },
  ],
  events: [
    {
      name: 'mth-change',
      cancelable: false,
      detailType: '{ value: string }',
    },
    {
      name: 'mth-focus-date',
      cancelable: false,
      detailType: '{ value: string }',
    },
  ],
  slots: [
    { name: 'header', description: 'Optional extra header controls.' },
    { name: 'footer', description: 'Optional footer content rendered below the calendar grid.' },
  ],
  parts: [
    { name: 'base', description: 'Outer calendar card container.' },
    { name: 'header', description: 'Month/year navigation header.' },
    { name: 'heading', description: 'Live month and year title.' },
    { name: 'nav-button', description: 'Previous/next month and year navigation buttons.' },
    { name: 'grid', description: 'Semantic calendar grid table.' },
    { name: 'weekday', description: 'Weekday column header cell.' },
    { name: 'cell', description: 'Grid cell wrapper.' },
    { name: 'day', description: 'Focusable day button.' },
    { name: 'status', description: 'Polite live region announcing month and selection changes.' },
  ],
  messages: {
    regionLabel: 'Calendar',
    previousYear: 'Previous year',
    previousMonth: 'Previous month',
    nextMonth: 'Next month',
    nextYear: 'Next year',
    today: 'Today',
    selected: 'Selected',
  },
};

export const CEM_METADATA = {
  description:
    'Accessible single-date WAI-ARIA calendar grid powered by `CalendarCore` and `FormattingUtils` with Temporal/Date fallback, min/max clamping, disabled dates, and RTL-aware roving grid keyboard navigation.',
  propDescriptions: {
    value: 'Selected date in ISO-8601 `YYYY-MM-DD` format.',
    min: 'Minimum selectable date in ISO-8601 `YYYY-MM-DD` format.',
    max: 'Maximum selectable date in ISO-8601 `YYYY-MM-DD` format.',
    locale: 'BCP-47 locale override for month, weekday, and first-day-of-week localization.',
    disabled: 'Disables all calendar navigation and day selection.',
    readonly: 'Allows grid navigation without changing the selected date.',
    isDateDisabled: 'Optional predicate returning true when a given ISO date should be disabled.',
  },
  eventDescriptions: {
    'mth-change': 'Emitted when a new date is selected.',
    'mth-focus-date': 'Emitted when the focused date moves inside the grid.',
  },
  cssProperties: [
    { name: '--mth-color-surface', description: 'Calendar background surface.' },
    { name: '--mth-color-accent', description: 'Selected day background color.' },
    { name: '--mth-color-accent-fg', description: 'Selected day foreground color.' },
    { name: '--mth-color-border', description: 'Calendar border color.' },
  ],
};
