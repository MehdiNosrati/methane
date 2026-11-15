import type { ComponentBehaviorSpec } from '@methane-ui/spec-compiler';
import { csvImporterMessages } from './csv-importer.messages.js';

export const csvImporterSpec: ComponentBehaviorSpec = {
  tag: 'mth-csv-importer',
  package: '@methane-ui/admin',
  conformance: [],
  controllers: [],
  focusModel: 'delegates-focus',
  states: ['empty', 'invalid'],
  keyboard: [],
  props: [
    { name: 'fields', attr: false, type: 'ReadonlyArray<CsvTargetField>', default: undefined },
    { name: 'rawCsv', attr: 'raw-csv', type: 'string', default: '' },
    { name: 'hasHeader', attr: 'has-header', type: 'boolean', default: true },
  ],
  events: [
    {
      name: 'mth-parse',
      cancelable: false,
      detailType: '{ headers: ReadonlyArray<string>; rowCount: number }',
    },
    {
      name: 'mth-import',
      cancelable: false,
      detailType:
        '{ rows: ReadonlyArray<Record<string, string>>; invalidCount: number; mappings: Record<number, string> }',
    },
  ],
  slots: [{ name: '', description: 'Optional helper instructions or actions slot.' }],
  parts: [
    { name: 'base', description: 'Outer CSV importer shell.' },
    { name: 'dropzone', description: 'File input and CSV paste input area.' },
    { name: 'mapping', description: 'Column-to-field mapping controls.' },
    { name: 'preview', description: 'Validated row preview table.' },
    { name: 'actions', description: 'Import commit and clear buttons.' },
  ],
  messages: csvImporterMessages,
};

export const CEM_METADATA = {
  description:
    'CSV file upload and paste importer (`<mth-csv-importer>`) with RFC-4180 parsing, interactive column-to-field mapping, row validation preview, and `mth-import` commit event.',
  propDescriptions: {
    fields: 'Target schema fields with required flags and optional row validators.',
    rawCsv: 'Raw CSV text payload to parse and map.',
    hasHeader: 'Whether the first CSV row contains column header names.',
  },
  eventDescriptions: {
    'mth-parse': 'Emitted after parsing CSV headers and rows.',
    'mth-import': 'Emitted when validated mapped rows are committed for import.',
  },
  cssProperties: [
    { name: '--mth-color-surface', description: 'Surface background for importer panels and table.' },
    { name: '--mth-color-bg-subtle', description: 'Subtle background for headers and dropzone.' },
    { name: '--mth-color-fg', description: 'Primary text color.' },
    { name: '--mth-color-fg-muted', description: 'Muted hint text color.' },
    { name: '--mth-color-border', description: 'Panel, table, and input borders.' },
    { name: '--mth-color-border-focus', description: 'Focus ring outline color.' },
    { name: '--mth-color-accent', description: 'Primary import button background.' },
    { name: '--mth-color-accent-fg', description: 'Primary import button foreground.' },
    { name: '--mth-color-danger', description: 'Row validation error highlight color.' },
  ],
};
