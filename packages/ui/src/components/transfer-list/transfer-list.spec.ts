import type { ComponentBehaviorSpec } from '@methane/spec-compiler';
import { transferListMessages } from './transfer-list.messages.js';

export const transferListSpec: ComponentBehaviorSpec = {
  tag: 'mth-transfer-list',
  package: '@methane/ui',
  conformance: ['form-control', 'listbox'],
  controllers: ['FormControlController', 'SelectionController', 'ListboxController'],
  focusModel: 'delegates-focus',
  states: ['dirty', 'touched', 'user-invalid', 'disabled', 'required'],
  keyboard: [
    { key: 'Tab', when: 'navigating component', expect: 'moves focus between search inputs, checkboxes, and transfer buttons' },
    { key: 'Space', when: 'checkbox focused', expect: 'toggles item or pane select-all selection' },
    { key: 'Enter / Space', when: 'transfer button focused', expect: 'moves checked or all eligible items between panes' },
  ],
  props: [
    { name: 'name', attr: 'name', type: 'string', default: '' },
    { name: 'value', attr: 'value', type: 'string', default: '' },
    { name: 'defaultValue', attr: 'default-value', type: 'string', default: '' },
    { name: 'options', attr: false, type: 'ReadonlyArray<TransferListItem> | null', default: null },
    { name: 'label', attr: 'label', type: 'string', default: '' },
    { name: 'sourceTitle', attr: 'source-title', type: 'string', default: '' },
    { name: 'targetTitle', attr: 'target-title', type: 'string', default: '' },
    { name: 'searchPlaceholder', attr: 'search-placeholder', type: 'string', default: '' },
    { name: 'searchable', attr: 'searchable', type: 'boolean', default: true },
    { name: 'hint', attr: 'hint', type: 'string', default: '' },
    { name: 'error', attr: 'error', type: 'string', default: '' },
    { name: 'disabled', attr: 'disabled', type: 'boolean', default: false },
    { name: 'required', attr: 'required', type: 'boolean', default: false },
  ],
  events: [
    {
      name: 'mth-change',
      cancelable: false,
      detailType:
        "{ value: string; targetKeys: ReadonlyArray<string>; movedKeys: ReadonlyArray<string>; direction: 'left' | 'right' }",
    },
  ],
  slots: [
    { name: 'label', description: 'Visible field label.' },
    { name: 'hint', description: 'Helper text.' },
    { name: 'error', description: 'Validation error message.' },
  ],
  parts: [
    { name: 'base', description: 'Outer wrapper.' },
    { name: 'label', description: 'Field label.' },
    { name: 'panes', description: 'Dual-pane shuttle grid container.' },
    { name: 'pane', description: 'Source or target list pane.' },
    { name: 'pane-header', description: 'Pane header with select-all checkbox and count.' },
    { name: 'search', description: 'Pane filter search input.' },
    { name: 'list', description: 'Pane items list.' },
    { name: 'item', description: 'Individual selectable item row.' },
    { name: 'actions', description: 'Center column containing shuttle action buttons.' },
    { name: 'action-button', description: 'Move items button.' },
    { name: 'hint', description: 'Helper text container.' },
    { name: 'error', description: 'Error message container.' },
  ],
  messages: { ...transferListMessages },
};

export const CEM_METADATA = {
  description: 'Form-associated dual-pane shuttle transfer list with per-pane filtering, select-all, and directional move controls.',
  propDescriptions: {
    name: 'Form field name submitted with FormData.',
    value: 'Comma-separated list of target item keys.',
    defaultValue: 'Initial target keys used when resetting the form.',
    options: 'Full list of TransferListItem options distributed across source and target panes.',
    label: 'Accessible group label.',
    sourceTitle: 'Heading shown above the source pane.',
    targetTitle: 'Heading shown above the target pane.',
    searchPlaceholder: 'Placeholder shown in pane search inputs.',
    searchable: 'Whether each pane renders a search filter input.',
    hint: 'Helper text displayed below the control.',
    error: 'Explicit error message displayed below the control.',
    disabled: 'Disables all pane checkboxes, search fields, and transfer buttons.',
    required: 'Requires at least one target item for form validity.',
  },
  eventDescriptions: {
    'mth-change': 'Fired when items are shuttled between the source and target panes.',
  },
  cssProperties: [
    { name: '--mth-transfer-pane-inline-size', description: 'Minimum inline size of each shuttle pane.' },
    { name: '--mth-transfer-list-block-size', description: 'Block size of each scrollable item list.' },
  ],
};
