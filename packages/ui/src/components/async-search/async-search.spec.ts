import type { ComponentBehaviorSpec } from '@methane/spec-compiler';
import { asyncSearchMessages } from './async-search.messages.js';

export const asyncSearchSpec: ComponentBehaviorSpec = {
  tag: 'mth-async-search',
  package: '@methane/ui',
  conformance: ['form-control', 'overlay', 'listbox', 'data-consumer'],
  controllers: [
    'FormControlController',
    'OverlayController',
    'PositioningController',
    'ListboxController',
    'DataController',
  ],
  focusModel: 'delegates-focus',
  states: ['dirty', 'touched', 'user-invalid', 'disabled', 'required'],
  keyboard: [
    { key: 'ArrowDown / ArrowUp', when: 'listbox open', expect: 'navigates active search result' },
    { key: 'Enter', when: 'option active', expect: 'selects active option and closes popover' },
    { key: 'Escape', when: 'listbox open', expect: 'closes popover and restores focus' },
  ],
  props: [
    { name: 'name', attr: 'name', type: 'string', default: '' },
    { name: 'value', attr: 'value', type: 'string', default: '' },
    { name: 'defaultValue', attr: 'default-value', type: 'string', default: '' },
    { name: 'dataSource', attr: false, type: 'DataSource<AsyncSearchOption, string> | null', default: null },
    { name: 'debounceMs', attr: 'debounce-ms', type: 'number', default: 200 },
    { name: 'label', attr: 'label', type: 'string', default: '' },
    { name: 'placeholder', attr: 'placeholder', type: 'string', default: '' },
    { name: 'hint', attr: 'hint', type: 'string', default: '' },
    { name: 'error', attr: 'error', type: 'string', default: '' },
    { name: 'open', attr: 'open', type: 'boolean', default: false },
    { name: 'disabled', attr: 'disabled', type: 'boolean', default: false },
    { name: 'required', attr: 'required', type: 'boolean', default: false },
  ],
  events: [
    { name: 'mth-change', cancelable: false, detailType: '{ value: string; item: AsyncSearchOption | null }' },
    { name: 'mth-search', cancelable: false, detailType: '{ query: string }' },
    { name: 'mth-open', cancelable: true, detailType: 'undefined' },
    { name: 'mth-after-open', cancelable: false, detailType: 'undefined' },
    { name: 'mth-close', cancelable: true, detailType: 'undefined' },
    { name: 'mth-after-close', cancelable: false, detailType: 'undefined' },
  ],
  slots: [
    { name: 'label', description: 'Visible field label.' },
    { name: 'hint', description: 'Helper text.' },
    { name: 'error', description: 'Error message.' },
  ],
  parts: [
    { name: 'base', description: 'Outer wrapper.' },
    { name: 'label', description: 'Field label.' },
    { name: 'control', description: 'Input box wrapper.' },
    { name: 'input', description: 'Search input element.' },
    { name: 'clear', description: 'Clear button.' },
    { name: 'listbox', description: 'Results overlay container.' },
    { name: 'option', description: 'Search result option.' },
    { name: 'status', description: 'Loading, empty, or error status indicator.' },
    { name: 'hint', description: 'Helper text.' },
    { name: 'error', description: 'Error text.' },
  ],
  messages: { ...asyncSearchMessages },
};

export const CEM_METADATA = {
  description:
    'Form-associated async search combobox backed by DataController with abortable queries, debounce, loading/empty/error states, and top-layer listbox.',
  propDescriptions: {
    name: 'Form field name.',
    value: 'Selected option value.',
    defaultValue: 'Initial value restored on form reset.',
    dataSource: 'Abortable async DataSource returning matching options.',
    debounceMs: 'Input debounce duration in milliseconds.',
    label: 'Visible field label.',
    placeholder: 'Search input placeholder.',
    hint: 'Helper message.',
    error: 'Validation error message.',
    open: 'Controls results popover visibility.',
    disabled: 'Disables interaction.',
    required: 'Requires a selected value.',
  },
  eventDescriptions: {
    'mth-change': 'Fired when user selects or clears a result.',
    'mth-search': 'Fired when an async query is dispatched.',
    'mth-open': 'Fired before opening results popover (cancelable).',
    'mth-after-open': 'Fired after opening results popover.',
    'mth-close': 'Fired before closing results popover (cancelable).',
    'mth-after-close': 'Fired after closing results popover.',
  },
  cssProperties: [
    { name: '--mth-async-search-bg', description: 'Input background.', default: 'var(--mth-color-surface)' },
    { name: '--mth-async-search-border', description: 'Input border.', default: 'var(--mth-color-border)' },
  ],
};
