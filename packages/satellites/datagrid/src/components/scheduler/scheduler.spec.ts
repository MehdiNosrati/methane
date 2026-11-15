import type { ComponentBehaviorSpec } from '@methane-ui/spec-compiler';
import { schedulerMessages } from './scheduler.messages.js';

export const schedulerSpec: ComponentBehaviorSpec = {
  tag: 'mth-scheduler',
  package: '@methane-ui/datagrid',
  conformance: ['satellite'],
  controllers: ['CalendarCore', 'RovingFocusController', 'VirtualizerController'],
  focusModel: 'host',
  states: ['empty'],
  keyboard: [
    { key: 'ArrowDown', when: 'resource row focused', expect: 'moves roving focus to next resource' },
    { key: 'ArrowUp', when: 'resource row focused', expect: 'moves roving focus to previous resource' },
    { key: 'ArrowRight', when: 'timeline focused', expect: 'advances focused date by 1 day (direction-aware)' },
    { key: 'ArrowLeft', when: 'timeline focused', expect: 'moves focused date back by 1 day (direction-aware)' },
    { key: 'Enter', when: 'scheduled event focused', expect: 'emits mth-event-select' },
  ],
  props: [
    { name: 'resources', attr: false, type: 'ReadonlyArray<SchedulerResource>' },
    { name: 'events', attr: false, type: 'ReadonlyArray<SchedulerEvent>' },
    { name: 'startDate', attr: 'start-date', type: 'string', default: '2026-01-05' },
    { name: 'days', attr: 'days', type: 'number', default: 7 },
    { name: 'rowHeight', attr: 'row-height', type: 'number', default: 48 },
    { name: 'label', attr: 'label', type: 'string', default: '' },
  ],
  events: [
    {
      name: 'mth-event-select',
      cancelable: false,
      detailType: '{ event: SchedulerEvent }',
    },
    {
      name: 'mth-date-navigate',
      cancelable: false,
      detailType: '{ date: string }',
    },
  ],
  slots: [{ name: 'fallback', description: 'Declarative SSR fallback schedule.' }],
  parts: [
    { name: 'base', description: 'Outer scheduler frame.' },
    { name: 'viewport', description: 'Scrollable timeline viewport.' },
    { name: 'grid', description: 'ARIA grid surface.' },
    { name: 'header', description: 'Date header row.' },
    { name: 'resource', description: 'Resource row.' },
    { name: 'slot-cell', description: 'Resource day cell.' },
    { name: 'event-bar', description: 'Scheduled event bar button.' },
    { name: 'status', description: 'Empty status notice.' },
  ],
  messages: { ...schedulerMessages },
};

export const CEM_METADATA = {
  description:
    'Resource timeline scheduler wrapping CalendarCore and @tanstack/virtual-core with RTL-aware keyboard date navigation and virtualized resource rows.',
  propDescriptions: {
    resources: 'Array of resource swimlanes.',
    events: 'Scheduled events mapped onto resource rows and date columns.',
    startDate: 'ISO start date (YYYY-MM-DD) of the visible timeline window.',
    days: 'Number of timeline day columns.',
    rowHeight: 'Estimated height of each resource swimlane in pixels.',
    label: 'Accessible scheduler grid label.',
  },
  eventDescriptions: {
    'mth-event-select': 'Fired when a scheduled event is activated.',
    'mth-date-navigate': 'Fired when keyboard navigation moves the active date.',
  },
  cssProperties: [
    { name: '--mth-color-surface', description: 'Scheduler background.' },
    { name: '--mth-color-bg-subtle', description: 'Timeline header background.' },
    { name: '--mth-color-border', description: 'Grid border color.' },
    { name: '--mth-color-accent', description: 'Event bar and focus accent.' },
  ],
};
