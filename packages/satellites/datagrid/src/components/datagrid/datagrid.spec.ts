import type { ComponentBehaviorSpec } from '@methane-ui/spec-compiler';
import { datagridMessages } from './datagrid.messages.js';

export const datagridSpec: ComponentBehaviorSpec = {
  tag: 'mth-datagrid',
  package: '@methane-ui/datagrid',
  conformance: ['satellite', 'data-consumer'],
  controllers: [
    'TableCore',
    'DataController',
    'RovingFocusController',
    'SelectionController',
    'VirtualizerController',
  ],
  focusModel: 'host',
  states: ['loading', 'empty', 'error', 'selectable'],
  keyboard: [
    { key: 'ArrowDown', when: 'grid row focused', expect: 'moves roving focus to next row' },
    { key: 'ArrowUp', when: 'grid row focused', expect: 'moves roving focus to previous row' },
    { key: 'Home', when: 'grid row focused', expect: 'moves roving focus to first row' },
    { key: 'End', when: 'grid row focused', expect: 'moves roving focus to last row' },
    { key: 'Enter', when: 'column sort header focused', expect: 'toggles sort order for column' },
  ],
  props: [
    { name: 'rows', attr: false, type: 'ReadonlyArray<Record<string, unknown>>' },
    { name: 'columns', attr: false, type: 'ReadonlyArray<DatagridColumn>' },
    { name: 'dataSource', attr: false, type: 'DataSource<Record<string, unknown>, string> | null' },
    { name: 'selectable', attr: 'selectable', type: 'boolean', default: false },
    { name: 'multiSort', attr: 'multi-sort', type: 'boolean', default: false },
    { name: 'filter', attr: 'filter', type: 'string', default: '' },
    { name: 'rowHeight', attr: 'row-height', type: 'number', default: 40 },
    { name: 'label', attr: 'label', type: 'string', default: '' },
  ],
  events: [
    {
      name: 'mth-sort-change',
      cancelable: false,
      detailType: '{ sorting: ReadonlyArray<{ id: string; desc: boolean }> }',
    },
    {
      name: 'mth-selection-change',
      cancelable: false,
      detailType: '{ selectedIds: ReadonlyArray<string> }',
    },
    {
      name: 'mth-column-resize',
      cancelable: false,
      detailType: '{ columnId: string; width: number }',
    },
  ],
  slots: [{ name: 'fallback', description: 'Declarative SSR fallback table or message.' }],
  parts: [
    { name: 'base', description: 'Outer grid wrapper.' },
    { name: 'viewport', description: 'Scrollable virtualized viewport container.' },
    { name: 'grid', description: 'ARIA grid table surface.' },
    { name: 'header', description: 'Sticky column header row.' },
    { name: 'row', description: 'Body data row.' },
    { name: 'cell', description: 'Body grid cell.' },
    { name: 'status', description: 'Loading, empty, or error status region.' },
  ],
  messages: { ...datagridMessages },
};

export const CEM_METADATA = {
  description:
    'Enterprise virtualized data grid wrapping @tanstack/table-core and @tanstack/virtual-core with sorting, filtering, pinning, column resizing, selection, and DataSource<T> streaming.',
  propDescriptions: {
    rows: 'Array of row records displayed in the grid.',
    columns: 'Column definitions with optional accessorKey, sortable, width, and pinned.',
    dataSource: 'Optional async DataSource<T, string> controller source.',
    selectable: 'Enables multi-row checkbox selection.',
    multiSort: 'Allows sorting across multiple columns simultaneously.',
    filter: 'Global search filter string applied across filterable columns.',
    rowHeight: 'Estimated virtual row block size in pixels.',
    label: 'Accessible grid label.',
  },
  eventDescriptions: {
    'mth-sort-change': 'Fired when column sorting updates.',
    'mth-selection-change': 'Fired when selected row IDs change.',
    'mth-column-resize': 'Fired when a column width is updated.',
  },
  cssProperties: [
    { name: '--mth-color-surface', description: 'Grid surface background.' },
    { name: '--mth-color-bg-subtle', description: 'Header and hover row background.' },
    { name: '--mth-color-border', description: 'Grid border color.' },
    { name: '--mth-color-accent', description: 'Selection and sort indicator accent.' },
  ],
};
