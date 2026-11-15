import type { ComponentBehaviorSpec } from '@methane-ui/spec-compiler';
import { filterBuilderMessages } from './filter-builder.messages.js';

export const filterBuilderSpec: ComponentBehaviorSpec = {
  tag: 'mth-filter-builder',
  package: '@methane-ui/admin',
  conformance: [],
  controllers: [],
  focusModel: 'delegates-focus',
  states: ['disabled', 'empty'],
  keyboard: [
    { key: 'Enter', when: 'focus is on add/remove rule controls', expect: 'adds or removes the target filter rule' },
  ],
  props: [
    { name: 'combinator', attr: 'combinator', type: "'and' | 'or'", default: 'and' },
    { name: 'fields', attr: false, type: 'ReadonlyArray<FilterFieldDef>', default: undefined },
    { name: 'rules', attr: false, type: 'ReadonlyArray<FilterRule>', default: undefined },
    { name: 'disabled', attr: 'disabled', type: 'boolean', default: false },
  ],
  events: [
    { name: 'mth-change', cancelable: false, detailType: "{ combinator: 'and' | 'or'; rules: ReadonlyArray<FilterRule> }" },
  ],
  slots: [
    { name: 'actions', description: 'Optional extra toolbar actions.' },
  ],
  parts: [
    { name: 'base', description: 'Outer filter builder container.' },
    { name: 'header', description: 'Combinator selector and actions bar.' },
    { name: 'rules', description: 'List of filter rule rows.' },
    { name: 'row', description: 'Single filter rule row.' },
    { name: 'add-btn', description: 'Button to append a filter rule.' },
    { name: 'clear-btn', description: 'Button to clear all filter rules.' },
  ],
  messages: filterBuilderMessages,
};

export const CEM_METADATA = {
  description: 'Interactive AND/OR filter rule builder (`<mth-filter-builder>`) for admin tables and search views.',
  propDescriptions: {
    combinator: 'Logical combinator joining rules (`and` or `or`).',
    fields: 'Available filterable field definitions.',
    rules: 'Active filter rules array.',
    disabled: 'Disables all interactive rule controls.',
  },
  eventDescriptions: {
    'mth-change': 'Emitted when rules or combinator change.',
  },
};
