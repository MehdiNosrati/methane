import type { ComponentBehaviorSpec } from '@methane-ui/spec-compiler';
import { savedViewsMessages } from './saved-views.messages.js';

export const savedViewsSpec: ComponentBehaviorSpec = {
  tag: 'mth-saved-views',
  package: '@methane-ui/admin',
  conformance: ['roving-focus'],
  controllers: ['SelectionController', 'RovingFocusController'],
  focusModel: 'delegates-focus',
  states: ['empty'],
  keyboard: [
    { key: 'ArrowRight', dir: 'ltr', when: 'tablist has focus', expect: 'moves focus to next saved view tab' },
    { key: 'ArrowLeft', dir: 'rtl', when: 'tablist has focus in RTL', expect: 'moves focus to next saved view tab' },
    { key: 'Home', when: 'tablist has focus', expect: 'moves focus to first saved view tab' },
    { key: 'End', when: 'tablist has focus', expect: 'moves focus to last saved view tab' },
  ],
  props: [
    { name: 'views', attr: false, type: 'ReadonlyArray<SavedViewItem>', default: undefined },
    { name: 'activeViewId', attr: 'active-view-id', type: 'string', default: '' },
    { name: 'allowCreate', attr: 'allow-create', type: 'boolean', default: true },
    { name: 'allowManage', attr: 'allow-manage', type: 'boolean', default: true },
  ],
  events: [
    { name: 'mth-view-select', cancelable: false, detailType: '{ id: string }' },
    { name: 'mth-view-create', cancelable: false, detailType: '{ view: SavedViewItem }' },
    { name: 'mth-view-duplicate', cancelable: false, detailType: '{ id: string; copy: SavedViewItem }' },
    { name: 'mth-view-pin', cancelable: false, detailType: '{ id: string; pinned: boolean }' },
    { name: 'mth-view-delete', cancelable: false, detailType: '{ id: string }' },
  ],
  slots: [],
  parts: [
    { name: 'base', description: 'Outer saved-views toolbar.' },
    { name: 'tablist', description: 'Horizontal list of saved view tabs.' },
    { name: 'tab', description: 'Individual saved view tab.' },
    { name: 'actions', description: 'Create/duplicate/pin/delete view actions.' },
  ],
  messages: savedViewsMessages,
};

export const CEM_METADATA = {
  description: 'Saved table/board view tabs (`<mth-saved-views>`) with create, duplicate, pin, and delete actions powered by SelectionController and RTL-aware RovingFocusController.',
  propDescriptions: {
    views: 'Array of saved view definitions.',
    activeViewId: 'Currently selected saved view ID.',
    allowCreate: 'Shows create view trigger.',
    allowManage: 'Shows duplicate, pin, and delete controls for the active view.',
  },
  eventDescriptions: {
    'mth-view-select': 'Emitted when the active saved view changes.',
    'mth-view-create': 'Emitted when a new saved view is created.',
    'mth-view-duplicate': 'Emitted when the active view is duplicated.',
    'mth-view-pin': 'Emitted when the active view pin state toggles.',
    'mth-view-delete': 'Emitted when a saved view is deleted.',
  },
};
