import type { ComponentBehaviorSpec } from '@methane/spec-compiler';
import { kanbanMessages } from './kanban.messages.js';

export const kanbanSpec: ComponentBehaviorSpec = {
  tag: 'mth-kanban',
  package: '@methane/admin',
  conformance: ['roving-focus', 'data-consumer'],
  controllers: ['DataController', 'RovingFocusController', 'DragSortController'],
  focusModel: 'delegates-focus',
  states: ['loading', 'empty', 'error'],
  keyboard: [
    { key: 'ArrowRight', when: 'a board card has focus', expect: 'moves focus to the next card (or previous in RTL)' },
    { key: 'ArrowLeft', when: 'a board card has focus', expect: 'moves focus to the previous card (or next in RTL)' },
    { key: 'Home', when: 'a board card has focus', expect: 'focuses the first card on the board' },
    { key: 'End', when: 'a board card has focus', expect: 'focuses the last card on the board' },
    { key: 'Space', when: 'a board card has focus', expect: 'grabs/drops the card for keyboard reordering' },
  ],
  props: [
    { name: 'lanes', attr: false, type: 'ReadonlyArray<KanbanLane>', default: undefined },
    { name: 'cards', attr: false, type: 'ReadonlyArray<KanbanCard>', default: undefined },
    { name: 'dataSource', attr: false, type: 'DataSource<KanbanCard, string> | null', default: undefined },
    { name: 'filter', attr: 'filter', type: 'string', default: '' },
  ],
  events: [
    {
      name: 'mth-card-move',
      cancelable: false,
      detailType:
        '{ cardId: string; fromLaneId: string; toLaneId: string; toIndex: number; cards: ReadonlyArray<KanbanCard> }',
    },
    {
      name: 'mth-card-select',
      cancelable: false,
      detailType: '{ card: KanbanCard }',
    },
  ],
  slots: [{ name: '', description: 'Optional board header controls.' }],
  parts: [
    { name: 'base', description: 'Outer board container.' },
    { name: 'lane', description: 'Individual lane column container.' },
    { name: 'lane-header', description: 'Lane title and WIP badge header.' },
    { name: 'wip-badge', description: 'Lane count and WIP indicator badge.' },
    { name: 'card', description: 'Interactive draggable Kanban card.' },
  ],
  messages: kanbanMessages,
};

export const CEM_METADATA = {
  description:
    'Multi-lane Kanban board (`<mth-kanban>`) with drag/keyboard card reordering, cross-lane moves, WIP limit badges, and async DataSource card loading.',
  propDescriptions: {
    lanes: 'Ordered lane definitions with optional WIP limits.',
    cards: 'Cards rendered across lanes.',
    dataSource: 'Optional async DataSource<KanbanCard, string> adapter.',
    filter: 'Filter string passed when querying dataSource.',
  },
  eventDescriptions: {
    'mth-card-move': 'Emitted when a card moves across lanes or reorders.',
    'mth-card-select': 'Emitted when a card is activated.',
  },
  cssProperties: [
    { name: '--mth-color-surface', description: 'Surface background for cards and WIP badges.' },
    { name: '--mth-color-bg-subtle', description: 'Subtle background for lane columns.' },
    { name: '--mth-color-fg', description: 'Primary text color.' },
    { name: '--mth-color-fg-muted', description: 'Muted metadata text color.' },
    { name: '--mth-color-border', description: 'Lane and card border color.' },
    { name: '--mth-color-border-focus', description: 'Focus ring outline color.' },
    { name: '--mth-color-accent', description: 'Grabbed card accent border color.' },
    { name: '--mth-color-danger', description: 'Over-WIP limit border and badge color.' },
  ],
};
