import type { ComponentBehaviorSpec } from '@methane-ui/spec-compiler';

export const calendarHeatmapSpec: ComponentBehaviorSpec = {
  tag: 'mth-calendar-heatmap',
  package: '@methane-ui/ui',
  conformance: ['roving-focus'],
  controllers: ['RovingFocusController'],
  focusModel: 'none',
  role: 'grid',
  states: ['has-selection'],
  keyboard: [
    { key: 'ArrowRight', dir: 'ltr', when: 'A heatmap day cell has focus', expect: 'Moves focus to next week in same weekday row' },
    { key: 'ArrowLeft', dir: 'rtl', when: 'A heatmap day cell has focus in RTL', expect: 'Moves focus to next week in same weekday row' },
    { key: 'ArrowDown', when: 'A heatmap day cell has focus', expect: 'Moves focus to next weekday row in same week' },
    { key: 'ArrowUp', when: 'A heatmap day cell has focus', expect: 'Moves focus to previous weekday row in same week' },
    { key: 'Home', when: 'A heatmap day cell has focus', expect: 'Moves focus to first day cell' },
    { key: 'End', when: 'A heatmap day cell has focus', expect: 'Moves focus to last day cell' },
    { key: 'Enter', when: 'A heatmap day cell has focus', expect: 'Selects date and emits mth-select' },
    { key: ' ', when: 'A heatmap day cell has focus', expect: 'Selects date and emits mth-select' },
  ],
  props: [
    { name: 'values', attr: false, type: 'ReadonlyArray<CalendarHeatmapEntry>' },
    { name: 'data', attr: 'data', type: 'string', default: '' },
    { name: 'endDate', attr: 'end-date', type: 'string', default: '' },
    { name: 'weeks', attr: 'weeks', type: 'number', default: 12 },
    { name: 'selectedDate', attr: 'selected-date', type: 'string', default: '' },
    { name: 'label', attr: 'label', type: 'string', default: '' },
  ],
  events: [
    {
      name: 'mth-select',
      cancelable: false,
      detailType: '{ date: string; count: number }',
    },
  ],
  slots: [
    { name: 'legend', description: 'Optional custom legend content.' },
  ],
  parts: [
    { name: 'base', description: 'Outer heatmap container.' },
    { name: 'grid', description: 'ARIA `role="grid"` calendar matrix.' },
    { name: 'row', description: 'ARIA `role="row"` weekday row.' },
    { name: 'cell', description: 'Interactive day cell button (`role="gridcell"`).' },
    { name: 'legend', description: 'Intensity scale legend.' },
  ],
  messages: {
    gridLabel: 'Activity calendar heatmap',
    cellLabel: '{date}: {count} contributions',
    legendLess: 'Less',
    legendMore: 'More',
  },
};

export const CEM_METADATA = {
  description: 'Accessible contribution calendar heatmap using `CalendarCore` date math and 2D `RovingFocusController` keyboard navigation across day cells.',
  propDescriptions: {
    values: 'Array of `{ date: string; count: number }` contribution entries.',
    data: 'Declarative `YYYY-MM-DD:count` comma-separated entries for HTML/SSR.',
    endDate: 'Inclusive ISO end date (`YYYY-MM-DD`) anchoring the heatmap window.',
    weeks: 'Number of week columns displayed.',
    selectedDate: 'Currently selected ISO date (`YYYY-MM-DD`).',
    label: 'Accessible label for the `role="grid"` container.',
  },
  eventDescriptions: {
    'mth-select': 'Emitted when a user selects a day cell.',
  },
  cssProperties: [
    { name: '--mth-color-bg-subtle', description: 'Level 0 empty day cell fill.' },
    { name: '--mth-color-accent', description: 'Level 4 highest intensity cell fill.' },
    { name: '--mth-space-1', description: 'Grid gap between cells.' },
  ],
};
