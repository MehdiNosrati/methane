import type { ComponentBehaviorSpec } from '@methane/spec-compiler';
import { pivotTableMessages } from './pivot-table.messages.js';

export const pivotTableSpec: ComponentBehaviorSpec = {
  tag: 'mth-pivot-table',
  package: '@methane/datagrid',
  conformance: ['satellite'],
  controllers: ['TableCore', 'SelectionController', 'RovingFocusController'],
  focusModel: 'host',
  states: ['empty', 'grouped'],
  keyboard: [
    { key: 'ArrowDown', when: 'pivot row focused', expect: 'moves roving focus to next row' },
    { key: 'ArrowUp', when: 'pivot row focused', expect: 'moves roving focus to previous row' },
    { key: 'Enter', when: 'group toggle focused', expect: 'toggles group expansion' },
  ],
  props: [
    { name: 'rows', attr: false, type: 'ReadonlyArray<Record<string, unknown>>' },
    { name: 'rowDimensions', attr: false, type: 'ReadonlyArray<string>' },
    { name: 'columnDimensions', attr: false, type: 'ReadonlyArray<string>' },
    { name: 'valueFields', attr: false, type: 'ReadonlyArray<string>' },
    { name: 'aggregator', attr: 'aggregator', type: "'sum' | 'count' | 'avg' | 'min' | 'max'", default: 'sum' },
    { name: 'showTotals', attr: 'show-totals', type: 'boolean', default: true },
    { name: 'label', attr: 'label', type: 'string', default: '' },
  ],
  events: [
    {
      name: 'mth-pivot-change',
      cancelable: false,
      detailType: '{ aggregator: string; groupCount: number }',
    },
    {
      name: 'mth-group-toggle',
      cancelable: false,
      detailType: '{ groupKey: string; expanded: boolean }',
    },
  ],
  slots: [{ name: 'fallback', description: 'Declarative SSR fallback table or message.' }],
  parts: [
    { name: 'base', description: 'Outer pivot wrapper.' },
    { name: 'viewport', description: 'Scrollable pivot viewport.' },
    { name: 'grid', description: 'ARIA grid table.' },
    { name: 'header', description: 'Header row.' },
    { name: 'row', description: 'Pivot group or detail row.' },
    { name: 'cell', description: 'Aggregated value cell.' },
    { name: 'totals', description: 'Grand totals summary row.' },
    { name: 'status', description: 'Empty state region.' },
  ],
  messages: { ...pivotTableMessages },
};

export const CEM_METADATA = {
  description:
    'Multi-dimensional pivot table satellite wrapping @tanstack/table-core with row/column dimension grouping, aggregations (sum, count, avg, min, max), expandable groups, and grand totals.',
  propDescriptions: {
    rows: 'Source records to aggregate.',
    rowDimensions: 'Field keys used for row grouping.',
    columnDimensions: 'Field keys used for pivot column buckets.',
    valueFields: 'Numeric field keys to aggregate.',
    aggregator: 'Aggregation function applied to value fields.',
    showTotals: 'Whether to display the grand totals row.',
    label: 'Accessible pivot grid label.',
  },
  eventDescriptions: {
    'mth-pivot-change': 'Fired when pivot computation or aggregator updates.',
    'mth-group-toggle': 'Fired when a pivot row group is expanded or collapsed.',
  },
  cssProperties: [
    { name: '--mth-color-surface', description: 'Table surface background.' },
    { name: '--mth-color-bg-subtle', description: 'Header and totals background.' },
    { name: '--mth-color-border', description: 'Grid border color.' },
    { name: '--mth-color-accent', description: 'Group toggle and focus accent.' },
  ],
};
