import type { ComponentBehaviorSpec } from '@methane-ui/spec-compiler';
import { toggleGroupMessages } from './toggle-group.messages.js';

export const toggleGroupSpec: ComponentBehaviorSpec = {
  tag: 'mth-toggle-group',
  package: '@methane-ui/ui',
  conformance: ['form-control', 'roving-focus'],
  controllers: [
    'FormControlController',
    'RovingFocusController',
    'SelectionController',
    'SlotCollectionController',
  ],
  focusModel: 'delegates-focus',
  states: ['dirty', 'touched', 'user-invalid', 'disabled', 'required'],
  keyboard: [
    { key: 'ArrowRight', dir: 'ltr', when: 'focused horizontal group', expect: 'moves focus to next item' },
    { key: 'ArrowLeft', dir: 'rtl', when: 'focused horizontal group', expect: 'moves focus to next item in RTL' },
    { key: 'ArrowDown', when: 'focused vertical group', expect: 'moves focus to next item' },
    { key: 'Home', when: 'focused on any item', expect: 'moves focus to first enabled item' },
    { key: 'End', when: 'focused on any item', expect: 'moves focus to last enabled item' },
    { key: 'Enter / Space', when: 'focused on an item', expect: 'toggles selection and updates value' },
  ],
  props: [
    { name: 'name', attr: 'name', type: 'string', default: '' },
    { name: 'value', attr: 'value', type: 'string', default: '' },
    { name: 'defaultValue', attr: 'default-value', type: 'string', default: '' },
    { name: 'label', attr: 'label', type: 'string', default: '' },
    { name: 'hint', attr: 'hint', type: 'string', default: '' },
    { name: 'error', attr: 'error', type: 'string', default: '' },
    { name: 'multiple', attr: 'multiple', type: 'boolean', default: false },
    { name: 'orientation', attr: 'orientation', type: "'horizontal' | 'vertical'", default: 'horizontal' },
    { name: 'size', attr: 'size', type: "'sm' | 'md' | 'lg'", default: 'md' },
    { name: 'disabled', attr: 'disabled', type: 'boolean', default: false },
    { name: 'required', attr: 'required', type: 'boolean', default: false },
    { name: 'options', attr: false, type: 'ReadonlyArray<ToggleGroupOption> | null', default: null },
  ],
  events: [
    {
      name: 'mth-change',
      cancelable: false,
      detailType: '{ value: string; values: ReadonlyArray<string> }',
    },
  ],
  slots: [
    { name: '', description: 'Declarative toggle items (`<button value="...">` or `<mth-option value="...">`).' },
    { name: 'label', description: 'Optional label slot mirrored inside shadow root.' },
    { name: 'hint', description: 'Optional helper text slot mirrored inside shadow root.' },
    { name: 'error', description: 'Optional validation error slot mirrored inside shadow root.' },
  ],
  parts: [
    { name: 'base', description: 'Outer field wrapper.' },
    { name: 'label', description: 'Group label element.' },
    { name: 'group', description: 'Button group container with roving focus.' },
    { name: 'item', description: 'Individual toggle button item.' },
    { name: 'hint', description: 'Helper text element.' },
    { name: 'error', description: 'Validation error text element.' },
  ],
  messages: { ...toggleGroupMessages },
};

export const CEM_METADATA = {
  description:
    'Form-associated single or multi-select toggle button group with roving focus, RTL awareness, and FACE validation.',
  propDescriptions: {
    name: 'Form submission field name.',
    value: 'Selected value (or comma-separated values when `multiple` is true).',
    defaultValue: 'Initial value restored on form reset.',
    label: 'Accessible label for the toggle group.',
    hint: 'Helper text linked via `aria-describedby`.',
    error: 'Explicit validation error message.',
    multiple: 'Allows toggling multiple pressed items simultaneously.',
    orientation: 'Roving focus orientation (`horizontal` or `vertical`).',
    size: 'Visual button size (`sm`, `md`, or `lg`).',
    disabled: 'Disables all items in the group.',
    required: 'Requires at least one selected item for form submission.',
    options: 'Imperative array of toggle items.',
  },
  eventDescriptions: {
    'mth-change': 'Fired when toggle selection changes.',
  },
  cssProperties: [
    { name: '--mth-color-accent-subtle', description: 'Pressed item background color.' },
    { name: '--mth-color-accent', description: 'Pressed item accent border/text color.' },
    { name: '--mth-color-border', description: 'Default group border color.' },
    { name: '--mth-radius-md', description: 'Group border radius.' },
  ],
};
