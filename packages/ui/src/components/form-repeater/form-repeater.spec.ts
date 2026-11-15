import type { ComponentBehaviorSpec } from '@methane/spec-compiler';
import { formRepeaterMessages } from './form-repeater.messages.js';

export const formRepeaterSpec: ComponentBehaviorSpec = {
  tag: 'mth-form-repeater',
  package: '@methane/ui',
  conformance: ['form-control'],
  controllers: ['FormControlController', 'DragSortController', 'ContextProtocol'],
  focusModel: 'delegates-focus',
  states: ['dirty', 'touched', 'user-invalid', 'disabled', 'required', 'readonly'],
  keyboard: [
    { key: 'Space', when: 'drag handle focused', expect: 'toggles keyboard drag grab state for row reordering' },
    { key: 'ArrowUp', when: 'row grabbed in DragSortController', expect: 'moves row earlier in list and emits mth-reorder' },
    { key: 'ArrowDown', when: 'row grabbed in DragSortController', expect: 'moves row later in list and emits mth-reorder' },
  ],
  props: [
    { name: 'value', attr: 'value', type: 'string', default: '' },
    { name: 'name', attr: 'name', type: 'string', default: '' },
    { name: 'label', attr: 'label', type: 'string', default: '' },
    { name: 'hint', attr: 'hint', type: 'string', default: '' },
    { name: 'error', attr: 'error', type: 'string', default: '' },
    { name: 'min', attr: 'min', type: 'number', default: 0 },
    { name: 'max', attr: 'max', type: 'number | undefined' },
    { name: 'reorderable', attr: 'reorderable', type: 'boolean', default: true },
    { name: 'addLabel', attr: 'add-label', type: 'string', default: '' },
    { name: 'disabled', attr: 'disabled', type: 'boolean', default: false },
    { name: 'required', attr: 'required', type: 'boolean', default: false },
    { name: 'readonly', attr: 'readonly', type: 'boolean', default: false },
  ],
  events: [
    { name: 'mth-input', cancelable: false, detailType: '{ value: string; items: RepeaterRow[] }' },
    { name: 'mth-change', cancelable: false, detailType: '{ value: string; items: RepeaterRow[] }' },
    { name: 'mth-add', cancelable: false, detailType: '{ index: number; row: RepeaterRow }' },
    { name: 'mth-remove', cancelable: false, detailType: '{ index: number; row: RepeaterRow }' },
    { name: 'mth-reorder', cancelable: false, detailType: '{ fromIndex: number; toIndex: number; item: HTMLElement }' },
  ],
  slots: [
    { name: 'label', description: 'Optional group label slot.' },
    { name: 'hint', description: 'Helper text slot.' },
    { name: 'error', description: 'Validation error slot.' },
  ],
  parts: [
    { name: 'base', description: 'Outer fieldset container.' },
    { name: 'label', description: 'Legend text.' },
    { name: 'list', description: 'Repeater row list.' },
    { name: 'row', description: 'Individual repeatable row card.' },
    { name: 'handle', description: 'Drag reorder handle.' },
    { name: 'control', description: 'Row field `<input>` element.' },
    { name: 'remove', description: 'Remove row button.' },
    { name: 'add', description: 'Add row button.' },
    { name: 'hint', description: 'Hint message container.' },
    { name: 'error', description: 'Error message container.' },
  ],
  messages: { ...formRepeaterMessages },
};

export const CEM_METADATA = {
  description:
    'Form-associated repeatable field row list with dynamic add/remove controls, min/max cardinality bounds, and accessible drag/keyboard reordering via `DragSortController`.',
  propDescriptions: {
    value: 'Serialized JSON array string of row objects.',
    name: 'Form submission field name.',
    label: 'Accessible fieldset legend.',
    hint: 'Helper text displayed below repeater.',
    error: 'Explicit custom error message.',
    min: 'Minimum required row count.',
    max: 'Maximum allowed row count.',
    reorderable: 'Enables pointer and keyboard row reordering.',
    addLabel: 'Custom label for the add row button.',
    disabled: 'Disables adding, removing, editing, and reordering.',
    required: 'Marks repeater required.',
    readonly: 'Prevents structural or value modifications.',
  },
  eventDescriptions: {
    'mth-input': 'Fired when any row value or ordering changes.',
    'mth-change': 'Fired when row changes commit.',
    'mth-add': 'Fired when a new row is appended.',
    'mth-remove': 'Fired when a row is removed.',
    'mth-reorder': 'Fired by `DragSortController` when a row moves.',
  },
  cssProperties: [
    { name: '--mth-color-surface', description: 'Row surface background.' },
    { name: '--mth-color-border', description: 'Row and button border color.' },
    { name: '--mth-color-border-focus', description: 'Focus ring color.' },
    { name: '--mth-radius-md', description: 'Corner radius.' },
  ],
};
