import type { ComponentBehaviorSpec } from '@methane/spec-compiler';
import { columnChooserMessages } from './column-chooser.messages.js';

export const columnChooserSpec: ComponentBehaviorSpec = {
  tag: 'mth-column-chooser',
  package: '@methane/admin',
  conformance: ['roving-focus'],
  controllers: ['DragSortController', 'SelectionController', 'RovingFocusController'],
  focusModel: 'delegates-focus',
  states: ['empty'],
  keyboard: [
    { key: 'ArrowDown', when: 'column list has focus', expect: 'moves focus to next column row' },
    { key: 'ArrowUp', when: 'column list has focus', expect: 'moves focus to previous column row' },
    { key: 'Space', when: 'drag-sort row has focus', expect: 'grabs/drops column for arrow reorder' },
  ],
  props: [
    { name: 'columns', attr: false, type: 'ReadonlyArray<ColumnChooserItem>', default: undefined },
    { name: 'allowReorder', attr: 'allow-reorder', type: 'boolean', default: true },
    { name: 'allowReset', attr: 'allow-reset', type: 'boolean', default: true },
  ],
  events: [
    { name: 'mth-change', cancelable: false, detailType: '{ columns: ReadonlyArray<ColumnChooserItem> }' },
    { name: 'mth-reset', cancelable: false, detailType: '{}' },
  ],
  slots: [],
  parts: [
    { name: 'base', description: 'Outer column chooser container.' },
    { name: 'header', description: 'Title and reset button header.' },
    { name: 'list', description: 'Reorderable column list.' },
    { name: 'item', description: 'Single column toggle and reorder row.' },
  ],
  messages: columnChooserMessages,
};

export const CEM_METADATA = {
  description: 'Column visibility & reorder panel (`<mth-column-chooser>`) composing DragSortController, SelectionController, and RovingFocusController.',
  propDescriptions: {
    columns: 'Ordered list of column definitions with visibility and lock flags.',
    allowReorder: 'Enables drag/keyboard/button column reordering.',
    allowReset: 'Displays reset-defaults button.',
  },
  eventDescriptions: {
    'mth-change': 'Emitted when visibility or column order changes.',
    'mth-reset': 'Emitted when defaults are restored.',
  },
};
