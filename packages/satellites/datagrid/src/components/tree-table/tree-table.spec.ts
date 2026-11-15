import type { ComponentBehaviorSpec } from '@methane/spec-compiler';
import { treeTableMessages } from './tree-table.messages.js';

export const treeTableSpec: ComponentBehaviorSpec = {
  tag: 'mth-tree-table',
  package: '@methane/datagrid',
  conformance: ['satellite'],
  controllers: ['TableCore', 'RovingFocusController', 'SelectionController', 'VirtualizerController'],
  focusModel: 'host',
  states: ['empty', 'selectable'],
  keyboard: [
    { key: 'ArrowDown', when: 'tree row focused', expect: 'moves roving focus to next visible row' },
    { key: 'ArrowUp', when: 'tree row focused', expect: 'moves roving focus to previous visible row' },
    { key: 'ArrowRight', when: 'collapsed parent row focused', expect: 'expands child rows' },
    { key: 'ArrowLeft', when: 'expanded parent row focused', expect: 'collapses child rows' },
    { key: 'Home', when: 'tree row focused', expect: 'moves roving focus to first row' },
    { key: 'End', when: 'tree row focused', expect: 'moves roving focus to last row' },
  ],
  props: [
    { name: 'rows', attr: false, type: 'ReadonlyArray<TreeTableRow>' },
    { name: 'columns', attr: false, type: 'ReadonlyArray<TreeTableColumn>' },
    { name: 'subRowsKey', attr: 'sub-rows-key', type: 'string', default: 'children' },
    { name: 'expandedIds', attr: false, type: 'ReadonlyArray<string>' },
    { name: 'selectable', attr: 'selectable', type: 'boolean', default: false },
    { name: 'rowHeight', attr: 'row-height', type: 'number', default: 38 },
    { name: 'label', attr: 'label', type: 'string', default: '' },
  ],
  events: [
    {
      name: 'mth-expand-change',
      cancelable: false,
      detailType: '{ rowId: string; expanded: boolean; expandedIds: ReadonlyArray<string> }',
    },
    {
      name: 'mth-selection-change',
      cancelable: false,
      detailType: '{ selectedIds: ReadonlyArray<string> }',
    },
  ],
  slots: [{ name: 'fallback', description: 'Declarative SSR fallback tree table.' }],
  parts: [
    { name: 'base', description: 'Outer tree table wrapper.' },
    { name: 'viewport', description: 'Scrollable viewport.' },
    { name: 'grid', description: 'ARIA treegrid surface.' },
    { name: 'header', description: 'Header row.' },
    { name: 'row', description: 'Tree row.' },
    { name: 'cell', description: 'Tree grid cell.' },
    { name: 'toggle', description: 'Expand/collapse disclosure button.' },
    { name: 'status', description: 'Empty state region.' },
  ],
  messages: { ...treeTableMessages },
};

export const CEM_METADATA = {
  description:
    'Hierarchical expandable tree table wrapping @tanstack/table-core getExpandedRowModel and @tanstack/virtual-core with treegrid keyboard navigation.',
  propDescriptions: {
    rows: 'Hierarchical tree row records.',
    columns: 'Column definitions.',
    subRowsKey: 'Property key holding nested child rows.',
    expandedIds: 'Controlled list of expanded row IDs.',
    selectable: 'Enables row selection checkboxes.',
    rowHeight: 'Estimated row height in pixels.',
    label: 'Accessible treegrid label.',
  },
  eventDescriptions: {
    'mth-expand-change': 'Fired when a row branch expands or collapses.',
    'mth-selection-change': 'Fired when selected row IDs change.',
  },
  cssProperties: [
    { name: '--mth-color-surface', description: 'Table surface background.' },
    { name: '--mth-color-bg-subtle', description: 'Header background.' },
    { name: '--mth-color-border', description: 'Cell border color.' },
    { name: '--mth-color-accent', description: 'Selection and focus accent.' },
  ],
};
