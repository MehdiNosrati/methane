import type { ComponentBehaviorSpec } from '@methane-ui/spec-compiler';
import { searchInputMessages } from './search-input.messages.js';

export const searchInputSpec: ComponentBehaviorSpec = {
  tag: 'mth-search-input',
  package: '@methane-ui/ui',
  conformance: ['form-control'],
  controllers: ['FormControlController', 'InputController', 'ContextProtocol'],
  focusModel: 'delegates-focus',
  states: ['dirty', 'touched', 'user-invalid', 'disabled', 'required', 'readonly'],
  keyboard: [
    { key: 'Enter', when: 'input focused and not composing IME', expect: 'emits immediate mth-search event' },
    { key: 'Escape', when: 'clearable and value non-empty', expect: 'clears query and emits mth-clear and mth-search' },
  ],
  props: [
    { name: 'value', attr: 'value', type: 'string', default: '' },
    { name: 'name', attr: 'name', type: 'string', default: '' },
    { name: 'label', attr: 'label', type: 'string', default: '' },
    { name: 'hint', attr: 'hint', type: 'string', default: '' },
    { name: 'error', attr: 'error', type: 'string', default: '' },
    { name: 'placeholder', attr: 'placeholder', type: 'string', default: '' },
    { name: 'autocomplete', attr: 'autocomplete', type: 'string', default: '' },
    { name: 'shortcut', attr: 'shortcut', type: 'string', default: '' },
    { name: 'debounce', attr: 'debounce', type: 'number', default: 300 },
    { name: 'clearable', attr: 'clearable', type: 'boolean', default: true },
    { name: 'disabled', attr: 'disabled', type: 'boolean', default: false },
    { name: 'required', attr: 'required', type: 'boolean', default: false },
    { name: 'readonly', attr: 'readonly', type: 'boolean', default: false },
  ],
  events: [
    { name: 'mth-input', cancelable: false, detailType: '{ value: string }' },
    { name: 'mth-change', cancelable: false, detailType: '{ value: string }' },
    { name: 'mth-search', cancelable: false, detailType: '{ value: string }' },
    { name: 'mth-clear', cancelable: false, detailType: 'Record<string, never>' },
  ],
  slots: [
    { name: 'label', description: 'Optional accessible label slot.' },
    { name: 'hint', description: 'Helper text slot.' },
    { name: 'error', description: 'Error text slot.' },
    { name: 'prefix', description: 'Leading icon or adornment override.' },
    { name: 'suffix', description: 'Trailing adornment beside clear button.' },
  ],
  parts: [
    { name: 'base', description: 'Outer field stack.' },
    { name: 'label', description: 'Shadow `<label>` element.' },
    { name: 'wrapper', description: 'Input chrome container.' },
    { name: 'icon', description: 'Leading search icon wrapper.' },
    { name: 'control', description: 'Internal `<input type="search">` control.' },
    { name: 'clear', description: 'Clear query button.' },
    { name: 'shortcut', description: 'Keyboard shortcut hint badge.' },
    { name: 'hint', description: 'Hint message container.' },
    { name: 'error', description: 'Error message container.' },
  ],
  messages: { ...searchInputMessages },
};

export const CEM_METADATA = {
  description:
    'Form-associated search field with debounced query emission, instant Enter search, accessible clear button, and keyboard shortcut hint.',
  propDescriptions: {
    value: 'Current search query string.',
    name: 'Form submission field name.',
    label: 'Accessible label rendered inside shadow root.',
    hint: 'Helper text displayed below the control.',
    error: 'Explicit validation error message.',
    placeholder: 'Placeholder displayed when empty.',
    autocomplete: 'HTML autocomplete attribute forwarded to the search input.',
    shortcut: 'Visual keyboard shortcut badge shown when empty (e.g. "⌘K").',
    debounce: 'Debounce delay in milliseconds before emitting `mth-search`.',
    clearable: 'Renders a clear button and enables Escape-to-clear when non-empty.',
    disabled: 'Disables user interaction.',
    required: 'Marks search input required.',
    readonly: 'Prevents edits while preserving focus and submission.',
  },
  eventDescriptions: {
    'mth-input': 'Fired on query edits.',
    'mth-change': 'Fired when query commits.',
    'mth-search': 'Fired after debounce on edits, immediately on Enter, or upon clear.',
    'mth-clear': 'Fired when the user clears the query.',
  },
  cssProperties: [
    { name: '--mth-color-surface', description: 'Search input background color.' },
    { name: '--mth-color-border', description: 'Default border color.' },
    { name: '--mth-color-border-focus', description: 'Focus outline color.' },
    { name: '--mth-radius-md', description: 'Input corner radius.' },
  ],
};
