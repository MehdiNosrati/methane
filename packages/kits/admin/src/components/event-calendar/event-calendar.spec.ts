import type { ComponentBehaviorSpec } from '@methane-ui/spec-compiler';
import { eventCalendarMessages } from './event-calendar.messages.js';

export const eventCalendarSpec: ComponentBehaviorSpec = {
  tag: 'mth-event-calendar',
  package: '@methane-ui/admin',
  conformance: ['roving-focus'],
  controllers: ['CalendarCore', 'RovingFocusController'],
  focusModel: 'delegates-focus',
  states: [],
  keyboard: [
    { key: 'ArrowRight', when: 'calendar grid has focus', expect: 'moves to next day (or previous in RTL)' },
    { key: 'ArrowLeft', when: 'calendar grid has focus', expect: 'moves to previous day (or next in RTL)' },
    { key: 'ArrowDown', when: 'calendar grid has focus', expect: 'moves down one week row' },
    { key: 'ArrowUp', when: 'calendar grid has focus', expect: 'moves up one week row' },
    { key: 'Home', when: 'calendar grid has focus', expect: 'focuses the first visible day cell' },
    { key: 'End', when: 'calendar grid has focus', expect: 'focuses the last visible day cell' },
  ],
  props: [
    { name: 'events', attr: false, type: 'ReadonlyArray<CalendarEvent>', default: undefined },
    { name: 'view', attr: 'view', type: "'month' | 'week' | 'day'", default: 'month' },
    { name: 'activeDate', attr: 'active-date', type: 'string', default: '' },
  ],
  events: [
    {
      name: 'mth-event-select',
      cancelable: false,
      detailType: '{ event: CalendarEvent }',
    },
    {
      name: 'mth-event-create',
      cancelable: false,
      detailType: '{ date: string; time?: string }',
    },
    {
      name: 'mth-date-change',
      cancelable: false,
      detailType: '{ activeDate: string; view: CalendarViewMode }',
    },
  ],
  slots: [{ name: '', description: 'Optional calendar toolbar actions.' }],
  parts: [
    { name: 'base', description: 'Outer calendar shell.' },
    { name: 'header', description: 'Period navigation and view-mode toolbar.' },
    { name: 'grid', description: 'Month, week, or day schedule grid.' },
    { name: 'day-cell', description: 'Individual day schedule container.' },
    { name: 'event-chip', description: 'Interactive event button.' },
  ],
  messages: eventCalendarMessages,
};

export const CEM_METADATA = {
  description:
    'Month/week/day schedule calendar (`<mth-event-calendar>`) powered by CalendarCore, localized FormattingUtils headers, RTL-aware 2D RovingFocusController, and event selection/creation callbacks.',
  propDescriptions: {
    events: 'Schedule events keyed by ISO date (`YYYY-MM-DD`).',
    view: 'Active schedule granularity (`month`, `week`, or `day`).',
    activeDate: 'Focused ISO date string (`YYYY-MM-DD`).',
  },
  eventDescriptions: {
    'mth-event-select': 'Emitted when an existing event pill is clicked.',
    'mth-event-create': 'Emitted when a day or time slot create button is clicked.',
    'mth-date-change': 'Emitted when the active date or view changes.',
  },
  cssProperties: [
    { name: '--mth-color-surface', description: 'Surface background for calendar cells.' },
    { name: '--mth-color-bg-subtle', description: 'Subtle background for outside-month cells and headers.' },
    { name: '--mth-color-fg', description: 'Primary text color.' },
    { name: '--mth-color-fg-muted', description: 'Muted weekday and out-of-month date text.' },
    { name: '--mth-color-border', description: 'Grid and button borders.' },
    { name: '--mth-color-border-focus', description: 'Focus ring outline color.' },
    { name: '--mth-color-accent', description: 'Active view button and event badge accent.' },
    { name: '--mth-color-accent-fg', description: 'Foreground on active accented controls.' },
  ],
};
