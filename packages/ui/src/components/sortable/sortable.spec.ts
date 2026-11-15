import type { ComponentBehaviorSpec } from '@methane-ui/spec-compiler';

export const sortableSpec: ComponentBehaviorSpec = {
  tag: 'mth-sortable',
  package: '@methane-ui/ui',
  conformance: ['roving-focus'],
  controllers: [
    'DragSortController',
    'SlotCollectionController',
    'RovingFocusController',
  ],
  focusModel: 'delegates-focus',
  states: ['disabled', 'dragging'],
  keyboard: [
    { key: 'ArrowUp', when: 'Vertical list item is focused', expect: 'Moves focus to previous sortable item' },
    { key: 'ArrowDown', when: 'Vertical list item is focused', expect: 'Moves focus to next sortable item' },
    { key: ' ', when: 'Sortable item is focused', expect: 'Grabs or drops item for keyboard reordering with Arrow keys' },
    { key: 'Escape', when: 'Keyboard reorder is in progress', expect: 'Cancels reorder and restores original position' },
  ],
  props: [
    { name: 'orientation', attr: 'orientation', type: "'vertical' | 'horizontal'", default: 'vertical' },
    { name: 'disabled', attr: 'disabled', type: 'boolean', default: false },
    { name: 'label', attr: 'label', type: 'string', default: '' },
  ],
  events: [
    { name: 'mth-reorder', cancelable: false, detailType: '{ fromIndex: number; toIndex: number; item: HTMLElement }' },
  ],
  slots: [
    { name: '', description: 'Sortable elements (or omit and supply `.items`).' },
  ],
  parts: [
    { name: 'base', description: 'Role-list sortable container.' },
    { name: 'item', description: 'Rendered item wrapper when `.items` is supplied.' },
  ],
  messages: {
    grabbed: 'Grabbed item {position} of {total}. Use arrow keys to reorder, Space to drop, Escape to cancel.',
    moved: 'Moved to position {position} of {total}.',
    dropped: 'Dropped at position {position} of {total}.',
    cancelled: 'Reordering cancelled.',
  },
};

export const CEM_METADATA = {
  description: 'Accessible pointer-and-keyboard reorderable list powered by `DragSortController`, `RovingFocusController`, and `LiveAnnouncer`.',
  propDescriptions: {
    orientation: 'List axis (`vertical` or `horizontal`, RTL-aware).',
    disabled: 'Disables drag and keyboard reordering.',
    label: 'Accessible `aria-label` for the sortable list container.',
  },
  eventDescriptions: {
    'mth-reorder': 'Fired when an item is moved from `fromIndex` to `toIndex`.',
  },
  cssProperties: [
    { name: '--mth-color-border', description: 'Default item border color.' },
    { name: '--mth-color-accent', description: 'Grabbed/active drag indicator color.' },
  ],
};
