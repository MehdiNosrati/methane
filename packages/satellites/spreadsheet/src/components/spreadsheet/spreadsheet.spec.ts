import type { ComponentBehaviorSpec } from '@methane-ui/spec-compiler';
import { spreadsheetMessages } from './spreadsheet.messages.js';

export const spreadsheetSpec: ComponentBehaviorSpec = {
  tag: 'mth-spreadsheet',
  package: '@methane-ui/spreadsheet',
  conformance: ['satellite'],
  controllers: [
    'VirtualizerController',
    'RovingFocusController',
    'SelectionController',
    'InputController',
  ],
  focusModel: 'host',
  states: ['readonly', 'editing'],
  keyboard: [
    { key: 'ArrowDown', when: 'cell focused', expect: 'moves active cell one row down' },
    { key: 'ArrowUp', when: 'cell focused', expect: 'moves active cell one row up' },
    { key: 'ArrowRight', when: 'cell focused', expect: 'moves active cell inline-end (direction-aware)' },
    { key: 'ArrowLeft', when: 'cell focused', expect: 'moves active cell inline-start (direction-aware)' },
    { key: 'Enter', when: 'cell focused', expect: 'opens inline formula/value editor or commits edit' },
    { key: 'Escape', when: 'editing cell', expect: 'cancels edit without committing' },
  ],
  props: [
    { name: 'rows', attr: 'rows', type: 'number', default: 20 },
    { name: 'cols', attr: 'cols', type: 'number', default: 8 },
    { name: 'cells', attr: false, type: 'Readonly<Record<string, string>>' },
    { name: 'addressMode', attr: 'address-mode', type: "'A1' | 'R1C1'", default: 'A1' },
    { name: 'activeCell', attr: 'active-cell', type: 'string', default: 'A1' },
    { name: 'rowHeight', attr: 'row-height', type: 'number', default: 32 },
    { name: 'readonly', attr: 'readonly', type: 'boolean', default: false },
    { name: 'label', attr: 'label', type: 'string', default: '' },
  ],
  events: [
    {
      name: 'mth-cell-select',
      cancelable: false,
      detailType: '{ address: string; displayAddress: string; raw: string; value: unknown }',
    },
    {
      name: 'mth-cell-change',
      cancelable: false,
      detailType: '{ address: string; raw: string; value: unknown }',
    },
  ],
  slots: [{ name: 'fallback', description: 'Declarative SSR fallback worksheet table.' }],
  parts: [
    { name: 'base', description: 'Outer spreadsheet container.' },
    { name: 'viewport', description: 'Scrollable virtualized sheet viewport.' },
    { name: 'grid', description: 'ARIA grid surface.' },
    { name: 'header', description: 'Column header row.' },
    { name: 'row', description: 'Worksheet row.' },
    { name: 'cell', description: 'Worksheet cell button.' },
    { name: 'editor', description: 'Active inline cell editor input.' },
  ],
  messages: { ...spreadsheetMessages },
};

export const CEM_METADATA = {
  description:
    'Virtualized spreadsheet satellite with clean-room MIT Formula AST evaluator, A1/R1C1 addressing, cycle detection, keyboard navigation, and TSV clipboard support.',
  propDescriptions: {
    rows: 'Total number of worksheet rows.',
    cols: 'Total number of worksheet columns.',
    cells: 'Map of A1 cell addresses to raw scalar or formula strings.',
    addressMode: 'Cell reference display mode (A1 or R1C1).',
    activeCell: 'Currently focused A1 cell address.',
    rowHeight: 'Estimated row height in pixels.',
    readonly: 'Prevents cell editing.',
    label: 'Accessible worksheet label.',
  },
  eventDescriptions: {
    'mth-cell-select': 'Fired when the active cell selection moves.',
    'mth-cell-change': 'Fired when a cell value or formula is committed.',
  },
  cssProperties: [
    { name: '--mth-color-surface', description: 'Worksheet surface background.' },
    { name: '--mth-color-bg-subtle', description: 'Header background.' },
    { name: '--mth-color-border', description: 'Cell grid border color.' },
    { name: '--mth-color-accent', description: 'Active cell outline accent.' },
  ],
};
