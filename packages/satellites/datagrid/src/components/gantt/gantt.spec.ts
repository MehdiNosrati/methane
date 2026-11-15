import type { ComponentBehaviorSpec } from '@methane-ui/spec-compiler';
import { ganttMessages } from './gantt.messages.js';

export const ganttSpec: ComponentBehaviorSpec = {
  tag: 'mth-gantt',
  package: '@methane-ui/datagrid',
  conformance: ['satellite'],
  controllers: ['CalendarCore', 'RovingFocusController', 'VirtualizerController'],
  focusModel: 'host',
  states: ['empty'],
  keyboard: [
    { key: 'ArrowDown', when: 'task row focused', expect: 'moves roving focus to next task' },
    { key: 'ArrowUp', when: 'task row focused', expect: 'moves roving focus to previous task' },
    { key: 'Home', when: 'task row focused', expect: 'moves roving focus to first task' },
    { key: 'End', when: 'task row focused', expect: 'moves roving focus to last task' },
    { key: 'Enter', when: 'task bar focused', expect: 'emits mth-task-select' },
  ],
  props: [
    { name: 'tasks', attr: false, type: 'ReadonlyArray<GanttTask>' },
    { name: 'startDate', attr: 'start-date', type: 'string', default: '2026-01-01' },
    { name: 'days', attr: 'days', type: 'number', default: 14 },
    { name: 'rowHeight', attr: 'row-height', type: 'number', default: 40 },
    { name: 'showDependencies', attr: 'show-dependencies', type: 'boolean', default: true },
    { name: 'label', attr: 'label', type: 'string', default: '' },
  ],
  events: [
    {
      name: 'mth-task-select',
      cancelable: false,
      detailType: '{ task: GanttTask }',
    },
  ],
  slots: [{ name: 'fallback', description: 'Declarative SSR fallback task table.' }],
  parts: [
    { name: 'base', description: 'Outer Gantt container.' },
    { name: 'viewport', description: 'Scrollable Gantt viewport.' },
    { name: 'grid', description: 'ARIA grid surface.' },
    { name: 'header', description: 'Timeline day header row.' },
    { name: 'row', description: 'Task row.' },
    { name: 'task-bar', description: 'Interactive task duration bar.' },
    { name: 'milestone', description: 'Milestone diamond marker.' },
    { name: 'dependencies', description: 'SVG dependency connector layer.' },
    { name: 'status', description: 'Empty state region.' },
  ],
  messages: { ...ganttMessages },
};

export const CEM_METADATA = {
  description:
    'Project Gantt timeline satellite wrapping CalendarCore and @tanstack/virtual-core with task progress bars, milestone markers, and SVG dependency lines.',
  propDescriptions: {
    tasks: 'List of project tasks with start/end dates, progress, milestones, and dependencies.',
    startDate: 'ISO start date (YYYY-MM-DD) of the Gantt horizon.',
    days: 'Total timeline days displayed.',
    rowHeight: 'Estimated row height in pixels.',
    showDependencies: 'Renders SVG dependency connector paths between tasks.',
    label: 'Accessible Gantt grid label.',
  },
  eventDescriptions: {
    'mth-task-select': 'Fired when a task bar or milestone is activated.',
  },
  cssProperties: [
    { name: '--mth-color-surface', description: 'Gantt surface background.' },
    { name: '--mth-color-bg-subtle', description: 'Header background.' },
    { name: '--mth-color-border', description: 'Grid border color.' },
    { name: '--mth-color-accent', description: 'Task bar and dependency connector color.' },
  ],
};
