import type { ComponentBehaviorSpec } from '@methane-ui/spec-compiler';
import { queryBuilderMessages } from './query-builder.messages.js';

export const queryBuilderSpec: ComponentBehaviorSpec = {
  tag: 'mth-query-builder',
  package: '@methane-ui/admin',
  conformance: ['form-control'],
  controllers: ['FormControlController'],
  focusModel: 'delegates-focus',
  states: ['disabled', 'readonly', 'invalid', 'dirty', 'touched'],
  keyboard: [
    { key: 'Enter', when: 'focus is on group/rule controls', expect: 'adds or updates query structure' },
  ],
  props: [
    { name: 'name', attr: 'name', type: 'string', default: '' },
    { name: 'value', attr: 'value', type: 'string', default: '{"combinator":"and","items":[]}' },
    { name: 'fields', attr: false, type: 'ReadonlyArray<QueryFieldDef>', default: undefined },
    { name: 'showPreview', attr: 'show-preview', type: 'boolean', default: true },
    { name: 'disabled', attr: 'disabled', type: 'boolean', default: false },
    { name: 'required', attr: 'required', type: 'boolean', default: false },
    { name: 'readonly', attr: 'readonly', type: 'boolean', default: false },
    { name: 'error', attr: 'error', type: 'string', default: '' },
  ],
  events: [
    { name: 'mth-change', cancelable: false, detailType: '{ value: string; query: QueryGroup }' },
  ],
  slots: [],
  parts: [
    { name: 'base', description: 'Outer query builder container.' },
    { name: 'group', description: 'Boolean query group container.' },
    { name: 'preview', description: 'Serialized JSON query preview.' },
    { name: 'error', description: 'Validation error message.' },
  ],
  messages: queryBuilderMessages,
};

export const CEM_METADATA = {
  description: 'Form-associated nested boolean query builder (`<mth-query-builder>`) with JSON/SQL-style preview and FormControlController validation.',
  propDescriptions: {
    name: 'Form field name for FormData submission.',
    value: 'Serialized JSON string of the query AST.',
    fields: 'Available field definitions.',
    showPreview: 'Displays serialized JSON query preview.',
    disabled: 'Disables all query controls.',
    required: 'Requires at least one leaf rule.',
    readonly: 'Prevents edits while allowing inspection.',
    error: 'Explicit error message.',
  },
  eventDescriptions: {
    'mth-change': 'Emitted when the nested query structure changes.',
  },
};
