import type { ComponentBehaviorSpec } from '@methane/spec-compiler';

export const columnSpec: ComponentBehaviorSpec = {
  tag: 'mth-column',
  package: '@methane/ui',
  conformance: [],
  controllers: [],
  focusModel: 'none',
  states: ['sortable', 'pinned'],
  keyboard: [],
  props: [
    { name: 'field', attr: 'field', type: 'string', default: '' },
    { name: 'header', attr: 'header', type: 'string', default: '' },
    { name: 'sortable', attr: 'sortable', type: 'boolean', default: false },
    { name: 'filterable', attr: 'filterable', type: 'boolean', default: true },
    { name: 'width', attr: 'width', type: 'number | null', default: null },
    { name: 'minWidth', attr: 'min-width', type: 'number | null', default: null },
    { name: 'pin', attr: 'pin', type: "'left' | 'right' | null", default: null },
    { name: 'align', attr: 'align', type: "'start' | 'center' | 'end'", default: 'start' },
  ],
  events: [],
  slots: [
    { name: '', description: 'Optional declarative header label fallback when `header` attribute is omitted.' },
  ],
  parts: [
    { name: 'base', description: 'Hidden Light-DOM metadata container.' },
  ],
  messages: {
    columnLabel: 'Table column',
  },
};

export const CEM_METADATA = {
  description: 'Declarative column definition element (`<mth-column>`) consumed by `<mth-table>` via `SlotCollectionController`.',
  propDescriptions: {
    field: 'Property key read from each row record.',
    header: 'Visible column header text.',
    sortable: 'Enables interactive sorting for this column.',
    filterable: 'Includes this column in global text filtering.',
    width: 'Optional explicit column width in pixels.',
    minWidth: 'Optional minimum column width in pixels.',
    pin: 'Optional column pinning side (`left`, `right`, or `null`).',
    align: 'Logical cell text alignment (`start`, `center`, `end`).',
  },
  eventDescriptions: {},
  cssProperties: [],
};
