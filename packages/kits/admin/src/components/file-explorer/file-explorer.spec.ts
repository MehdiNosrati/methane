import type { ComponentBehaviorSpec } from '@methane-ui/spec-compiler';
import { fileExplorerMessages } from './file-explorer.messages.js';

export const fileExplorerSpec: ComponentBehaviorSpec = {
  tag: 'mth-file-explorer',
  package: '@methane-ui/admin',
  conformance: ['roving-focus'],
  controllers: ['SelectionController', 'RovingFocusController'],
  focusModel: 'delegates-focus',
  states: [],
  keyboard: [
    { key: 'ArrowRight', when: 'an entry has focus', expect: 'moves focus to next entry (or previous in RTL)' },
    { key: 'ArrowLeft', when: 'an entry has focus', expect: 'moves focus to previous entry (or next in RTL)' },
    { key: 'ArrowDown', when: 'an entry has focus', expect: 'moves focus down in list or grid' },
    { key: 'ArrowUp', when: 'an entry has focus', expect: 'moves focus up in list or grid' },
    { key: 'Home', when: 'an entry has focus', expect: 'focuses the first entry' },
    { key: 'End', when: 'an entry has focus', expect: 'focuses the last entry' },
  ],
  props: [
    { name: 'items', attr: false, type: 'ReadonlyArray<FileExplorerItem>', default: undefined },
    { name: 'currentFolderId', attr: 'current-folder-id', type: 'string | null', default: undefined },
    { name: 'viewMode', attr: 'view-mode', type: "'list' | 'grid'", default: 'list' },
    { name: 'columns', attr: 'columns', type: 'number', default: 3 },
  ],
  events: [
    {
      name: 'mth-navigate',
      cancelable: false,
      detailType: '{ folderId: string | null }',
    },
    {
      name: 'mth-file-open',
      cancelable: false,
      detailType: '{ item: FileExplorerItem }',
    },
    {
      name: 'mth-selection-change',
      cancelable: false,
      detailType: '{ selectedIds: ReadonlyArray<string> }',
    },
  ],
  slots: [{ name: '', description: 'Optional toolbar actions slot.' }],
  parts: [
    { name: 'base', description: 'Outer file explorer shell.' },
    { name: 'toolbar', description: 'Breadcrumb navigation and view switcher bar.' },
    { name: 'tree', description: 'Folder hierarchy sidebar.' },
    { name: 'entries', description: 'Main list or grid container of folder entries.' },
    { name: 'entry', description: 'Individual selectable file or folder item.' },
  ],
  messages: fileExplorerMessages,
};

export const CEM_METADATA = {
  description:
    'File and folder explorer (`<mth-file-explorer>`) with hierarchical folder tree, clickable path breadcrumbs, list/grid views, multi-select, and 2D RTL-aware keyboard navigation.',
  propDescriptions: {
    items: 'Flat list of files and folders linked via `parentId`.',
    currentFolderId: 'Active directory ID (`null` for root).',
    viewMode: 'Layout mode (`list` or `grid`).',
    columns: 'Number of grid columns when `viewMode="grid"`.',
  },
  eventDescriptions: {
    'mth-navigate': 'Emitted when navigating to another folder.',
    'mth-file-open': 'Emitted when opening a file.',
    'mth-selection-change': 'Emitted when the selected item IDs change.',
  },
  cssProperties: [
    { name: '--mth-color-surface', description: 'Surface background for explorer container.' },
    { name: '--mth-color-bg-subtle', description: 'Subtle background for sidebar and selected hover.' },
    { name: '--mth-color-fg', description: 'Primary text color.' },
    { name: '--mth-color-fg-muted', description: 'Secondary metadata text color.' },
    { name: '--mth-color-border', description: 'Border color across panes and items.' },
    { name: '--mth-color-border-focus', description: 'Keyboard focus ring color.' },
    { name: '--mth-color-accent', description: 'Selected item and active view highlight.' },
    { name: '--mth-color-accent-fg', description: 'Text color on accented controls.' },
  ],
};
