import type { ComponentBehaviorSpec } from '@methane/spec-compiler';
import { bulkActionBarMessages } from './bulk-action-bar.messages.js';

export const bulkActionBarSpec: ComponentBehaviorSpec = {
  tag: 'mth-bulk-action-bar',
  package: '@methane/admin',
  conformance: ['roving-focus'],
  controllers: ['RovingFocusController'],
  focusModel: 'delegates-focus',
  states: ['active'],
  keyboard: [
    { key: 'ArrowRight', dir: 'ltr', when: 'bulk toolbar has focus', expect: 'moves focus to next action button' },
    { key: 'ArrowLeft', dir: 'rtl', when: 'bulk toolbar has focus in RTL', expect: 'moves focus to next action button' },
  ],
  props: [
    { name: 'selectedCount', attr: 'selected-count', type: 'number', default: 0 },
    { name: 'totalCount', attr: 'total-count', type: 'number', default: 0 },
    { name: 'actions', attr: false, type: 'ReadonlyArray<BulkActionItem>', default: undefined },
    { name: 'showWhenEmpty', attr: 'show-when-empty', type: 'boolean', default: false },
  ],
  events: [
    { name: 'mth-select-all', cancelable: false, detailType: '{ totalCount: number }' },
    { name: 'mth-clear-selection', cancelable: false, detailType: '{}' },
    { name: 'mth-action', cancelable: false, detailType: '{ id: string; selectedCount: number }' },
  ],
  slots: [],
  parts: [
    { name: 'base', description: 'Outer bulk action toolbar.' },
    { name: 'count', description: 'Pluralized selected item readout.' },
    { name: 'actions', description: 'Action button group.' },
  ],
  messages: bulkActionBarMessages,
};

export const CEM_METADATA = {
  description: 'Contextual selection toolbar (`<mth-bulk-action-bar>`) with Intl.PluralRules count formatting, select-all/clear triggers, and RTL-aware RovingFocusController.',
  propDescriptions: {
    selectedCount: 'Number of currently selected rows/items.',
    totalCount: 'Total available item count for select-all state.',
    actions: 'Bulk action buttons rendered in the toolbar.',
    showWhenEmpty: 'Keeps the toolbar visible when selectedCount is 0.',
  },
  eventDescriptions: {
    'mth-select-all': 'Emitted when select-all is clicked.',
    'mth-clear-selection': 'Emitted when clear-selection is clicked.',
    'mth-action': 'Emitted when a bulk action button is clicked.',
  },
};
