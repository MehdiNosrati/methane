import type { ComponentBehaviorSpec } from '@methane/spec-compiler';

export const dateRangeCalendarSpec: ComponentBehaviorSpec = {
  tag: 'mth-date-range-calendar',
  package: '@methane/ui',
  conformance: [],
  controllers: ['CalendarCore'],
  focusModel: 'delegates-focus',
  states: ['disabled', 'readonly'],
  keyboard: [
    {
      key: 'ArrowRight',
      when: 'Day button inside range grid is focused',
      expect: 'Moves focus one day forward (or backward in RTL)',
    },
    {
      key: 'ArrowLeft',
      when: 'Day button inside range grid is focused',
      expect: 'Moves focus one day backward (or forward in RTL)',
    },
    {
      key: 'ArrowDown',
      when: 'Day button inside range grid is focused',
      expect: 'Moves focus down one week (+7 days)',
    },
    {
      key: 'ArrowUp',
      when: 'Day button inside range grid is focused',
      expect: 'Moves focus up one week (-7 days)',
    },
  ],
  props: [
    { name: 'start', attr: 'start', type: 'string', default: '' },
    { name: 'end', attr: 'end', type: 'string', default: '' },
    { name: 'min', attr: 'min', type: 'string', default: '' },
    { name: 'max', attr: 'max', type: 'string', default: '' },
    { name: 'months', attr: 'months', type: 'number', default: 2 },
    { name: 'locale', attr: 'locale', type: 'string', default: '' },
    { name: 'disabled', attr: 'disabled', type: 'boolean', default: false },
    { name: 'readonly', attr: 'readonly', type: 'boolean', default: false },
    { name: 'isDateDisabled', attr: false, type: '((iso: string) => boolean) | undefined', default: undefined },
  ],
  events: [
    {
      name: 'mth-change',
      cancelable: false,
      detailType: '{ start: string; end: string }',
    },
  ],
  slots: [
    { name: 'header', description: 'Optional header preset controls.' },
    { name: 'footer', description: 'Optional footer actions rendered below the calendars.' },
  ],
  parts: [
    { name: 'base', description: 'Outer date range calendar container.' },
    { name: 'header', description: 'Navigation bar.' },
    { name: 'months', description: 'Container holding one or more visible month grids.' },
    { name: 'month', description: 'Single month card wrapper.' },
    { name: 'heading', description: 'Month and year heading.' },
    { name: 'nav-button', description: 'Previous/next month and year navigation buttons.' },
    { name: 'grid', description: 'Month calendar grid table.' },
    { name: 'weekday', description: 'Weekday column header.' },
    { name: 'cell', description: 'Grid cell wrapper.' },
    { name: 'day', description: 'Focusable day button with start/end/in-range state.' },
    { name: 'status', description: 'Polite live announcement for range selection and month navigation.' },
  ],
  messages: {
    regionLabel: 'Date range calendar',
    previousYear: 'Previous year',
    previousMonth: 'Previous month',
    nextMonth: 'Next month',
    nextYear: 'Next year',
  },
};

export const CEM_METADATA = {
  description:
    'Multi-month accessible date-range picker calendar powered by `CalendarCore` (`mode: "range"`) and `FormattingUtils` with logical range-highlight styling, live hover/focus preview, and RTL-aware 2D grid navigation.',
  propDescriptions: {
    start: 'Selected range start date in ISO-8601 `YYYY-MM-DD` format.',
    end: 'Selected range end date in ISO-8601 `YYYY-MM-DD` format.',
    min: 'Minimum selectable date in ISO-8601 `YYYY-MM-DD` format.',
    max: 'Maximum selectable date in ISO-8601 `YYYY-MM-DD` format.',
    months: 'Number of side-by-side months to display (`1` or `2`).',
    locale: 'BCP-47 locale override for month names, weekdays, and first day of week.',
    disabled: 'Disables calendar interaction.',
    readonly: 'Allows grid focus navigation without modifying the range.',
    isDateDisabled: 'Optional predicate returning true for disabled ISO dates.',
  },
  eventDescriptions: {
    'mth-change': 'Emitted when the range selection is updated with `{ start, end }`.',
  },
  cssProperties: [
    { name: '--mth-color-surface', description: 'Calendar background surface.' },
    { name: '--mth-color-accent', description: 'Range endpoint background color.' },
    { name: '--mth-color-accent-subtle', description: 'In-range day highlight surface color.' },
    { name: '--mth-color-accent-fg', description: 'Range endpoint text color.' },
  ],
};
