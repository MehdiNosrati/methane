import type { ComponentBehaviorSpec } from '@methane-ui/spec-compiler';

export const listSpec: ComponentBehaviorSpec = {
  tag: 'mth-list',
  package: '@methane-ui/ui',
  conformance: ['roving-focus'],
  controllers: ['SlotCollectionController', 'RovingFocusController', 'SelectionController'],
  focusModel: 'none',
  role: 'list',
  states: ['dividers', 'dense', 'selectable'],
  keyboard: [
    { key: 'ArrowDown', when: 'List item has focus', expect: 'Moves focus to next enabled item' },
    { key: 'ArrowUp', when: 'List item has focus', expect: 'Moves focus to previous enabled item' },
    { key: 'Home', when: 'List item has focus', expect: 'Moves focus to first enabled item' },
    { key: 'End', when: 'List item has focus', expect: 'Moves focus to last enabled item' },
    { key: 'Enter', when: 'List item has focus', expect: 'Activates item and toggles/selects when selectionMode != none' },
    { key: ' ', when: 'List item has focus', expect: 'Activates item and toggles/selects when selectionMode != none' },
  ],
  props: [
    { name: 'selectionMode', attr: 'selection-mode', type: "'none' | 'single' | 'multiple'", default: 'none' },
    { name: 'value', attr: 'value', type: 'string', default: '' },
    { name: 'values', attr: false, type: 'ReadonlyArray<string>' },
    { name: 'items', attr: false, type: 'ReadonlyArray<ListItemData> | null', default: null },
    { name: 'dividers', attr: 'dividers', type: 'boolean', default: false },
    { name: 'dense', attr: 'dense', type: 'boolean', default: false },
    { name: 'label', attr: 'label', type: 'string', default: '' },
  ],
  events: [
    {
      name: 'mth-change',
      cancelable: false,
      detailType: '{ value: string; values: ReadonlyArray<string> }',
    },
    {
      name: 'mth-action',
      cancelable: false,
      detailType: '{ value: string }',
    },
  ],
  slots: [
    { name: '', description: 'Slotted `<mth-list-item>` elements.' },
    { name: 'empty', description: 'Fallback content rendered when the list has no items.' },
  ],
  parts: [
    { name: 'base', description: 'Outer list container (`role="list"` or `role="listbox"`).' },
    { name: 'item', description: 'Rendered item row when using imperative `.items` data.' },
    { name: 'empty', description: 'Empty fallback container.' },
  ],
  messages: {
    listLabel: 'List',
    emptyText: 'No items',
  },
};

export const CEM_METADATA = {
  description: 'Accessible vertical list coordinating `<mth-list-item>` children or `.items` data with `RovingFocusController` and `SelectionController`.',
  propDescriptions: {
    selectionMode: 'Selection behavior (`none`, `single`, or `multiple`).',
    value: 'Selected item value in single-selection mode.',
    values: 'Array of selected item values.',
    items: 'Optional imperative item list when not using slotted `<mth-list-item>` children.',
    dividers: 'Renders subtle hairline dividers between list items.',
    dense: 'Reduces vertical spacing for compact layouts.',
    label: 'Accessible label for the list container.',
  },
  eventDescriptions: {
    'mth-change': 'Emitted when item selection changes.',
    'mth-action': 'Emitted when a list item is clicked or activated with Enter/Space.',
  },
  cssProperties: [
    { name: '--mth-color-border', description: 'Divider border color.' },
    { name: '--mth-space-1', description: 'Gap between items.' },
  ],
};
