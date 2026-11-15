import type { ComponentBehaviorSpec } from '@methane/spec-compiler';
import { segmentedControlMessages } from './segmented-control.messages.js';

export const segmentedControlSpec: ComponentBehaviorSpec = {
  tag: 'mth-segmented-control',
  package: '@methane/ui',
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
    { key: 'ArrowRight', dir: 'ltr', when: 'segment focused', expect: 'moves focus to next segment' },
    { key: 'ArrowLeft', dir: 'rtl', when: 'segment focused', expect: 'moves focus to next segment in RTL' },
    { key: 'Home / End', when: 'segment focused', expect: 'moves focus to first or last enabled segment' },
    { key: 'Enter / Space', when: 'segment focused', expect: 'selects the focused segment' },
  ],
  props: [
    { name: 'name', attr: 'name', type: 'string', default: '' },
    { name: 'value', attr: 'value', type: 'string', default: '' },
    { name: 'defaultValue', attr: 'default-value', type: 'string', default: '' },
    { name: 'label', attr: 'label', type: 'string', default: '' },
    { name: 'hint', attr: 'hint', type: 'string', default: '' },
    { name: 'error', attr: 'error', type: 'string', default: '' },
    { name: 'size', attr: 'size', type: "'sm' | 'md' | 'lg'", default: 'md' },
    { name: 'fullWidth', attr: 'full-width', type: 'boolean', default: false },
    { name: 'disabled', attr: 'disabled', type: 'boolean', default: false },
    { name: 'required', attr: 'required', type: 'boolean', default: false },
    { name: 'options', attr: false, type: 'ReadonlyArray<SegmentedControlOption> | null', default: null },
  ],
  events: [{ name: 'mth-change', cancelable: false, detailType: '{ value: string }' }],
  slots: [
    { name: '', description: 'Declarative segment items with value or data-value attributes.' },
    { name: 'label', description: 'Custom label content.' },
    { name: 'hint', description: 'Helper text.' },
    { name: 'error', description: 'Error text.' },
  ],
  parts: [
    { name: 'base', description: 'Outer field wrapper.' },
    { name: 'label', description: 'Visible label.' },
    { name: 'track', description: 'Segmented track background.' },
    { name: 'indicator', description: 'Sliding active segment indicator pill.' },
    { name: 'segment', description: 'Individual segment button.' },
    { name: 'hint', description: 'Helper text container.' },
    { name: 'error', description: 'Validation error container.' },
  ],
  messages: { ...segmentedControlMessages },
};

export const CEM_METADATA = {
  description:
    'Form-associated single-select segmented control with animated RTL-safe active indicator pill, roving focus, and slotted or options-driven items.',
  propDescriptions: {
    name: 'Form field name.',
    value: 'Selected segment value.',
    defaultValue: 'Initial value restored on form reset.',
    label: 'Group label.',
    hint: 'Helper message.',
    error: 'Validation error message.',
    size: 'Control size variant.',
    fullWidth: 'Expands control to full container width.',
    disabled: 'Disables the segmented control.',
    required: 'Marks selection required.',
    options: 'Programmatic array of segmented options.',
  },
  eventDescriptions: {
    'mth-change': 'Dispatched when the user selects a segment.',
  },
  cssProperties: [
    { name: '--mth-segmented-bg', description: 'Track surface background.', default: 'var(--mth-color-bg-subtle)' },
    { name: '--mth-segmented-indicator-bg', description: 'Active pill background.', default: 'var(--mth-color-surface)' },
    { name: '--mth-segmented-fg-active', description: 'Active segment text color.', default: 'var(--mth-color-fg)' },
  ],
};
