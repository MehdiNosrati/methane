import type { ComponentBehaviorSpec } from '@methane/spec-compiler';
import { ratingMessages } from './rating.messages.js';

export const ratingSpec: ComponentBehaviorSpec = {
  tag: 'mth-rating',
  package: '@methane/ui',
  conformance: ['form-control', 'roving-focus'],
  controllers: ['FormControlController', 'RovingFocusController'],
  focusModel: 'delegates-focus',
  states: ['dirty', 'touched', 'user-invalid', 'disabled', 'required'],
  keyboard: [
    { key: 'ArrowRight', dir: 'ltr', when: 'star focused', expect: 'moves focus to next star' },
    { key: 'ArrowLeft', dir: 'rtl', when: 'star focused', expect: 'moves focus to next star in RTL' },
    { key: 'Home / End', when: 'star focused', expect: 'moves focus to first or last star' },
    { key: 'Enter / Space', when: 'star focused', expect: 'selects focused star rating' },
  ],
  props: [
    { name: 'name', attr: 'name', type: 'string', default: '' },
    { name: 'value', attr: 'value', type: 'string', default: '' },
    { name: 'defaultValue', attr: 'default-value', type: 'string', default: '' },
    { name: 'max', attr: 'max', type: 'number', default: 5 },
    { name: 'label', attr: 'label', type: 'string', default: '' },
    { name: 'hint', attr: 'hint', type: 'string', default: '' },
    { name: 'error', attr: 'error', type: 'string', default: '' },
    { name: 'size', attr: 'size', type: "'sm' | 'md' | 'lg'", default: 'md' },
    { name: 'precision', attr: 'precision', type: 'number', default: 1 },
    { name: 'clearable', attr: 'clearable', type: 'boolean', default: false },
    { name: 'disabled', attr: 'disabled', type: 'boolean', default: false },
    { name: 'readonly', attr: 'readonly', type: 'boolean', default: false },
    { name: 'required', attr: 'required', type: 'boolean', default: false },
  ],
  events: [{ name: 'mth-change', cancelable: false, detailType: '{ value: string; rating: number }' }],
  slots: [
    { name: 'label', description: 'Custom group label content.' },
    { name: 'hint', description: 'Helper message.' },
    { name: 'error', description: 'Error message.' },
  ],
  parts: [
    { name: 'base', description: 'Root container.' },
    { name: 'label', description: 'Group label element.' },
    { name: 'group', description: 'Radiogroup container.' },
    { name: 'star', description: 'Individual star radio button.' },
    { name: 'icon', description: 'Star vector glyph.' },
    { name: 'hint', description: 'Hint message container.' },
    { name: 'error', description: 'Error message container.' },
  ],
  messages: { ...ratingMessages },
};

export const CEM_METADATA = {
  description:
    'Form-associated star rating control implementing radiogroup and roving focus with hover preview, optional half-stars, and keyboard selection.',
  propDescriptions: {
    name: 'Form field name.',
    value: 'Current selected rating string (e.g. "4" or "3.5").',
    defaultValue: 'Initial rating string used on reset.',
    max: 'Maximum star count.',
    label: 'Group label text.',
    hint: 'Helper message.',
    error: 'Error message.',
    size: 'Star icon size.',
    precision: 'Selection increment (1 or 0.5).',
    clearable: 'Whether clicking the active star clears the value.',
    disabled: 'Disables all star buttons.',
    readonly: 'Prevents rating changes.',
    required: 'Marks rating required for form validation.',
  },
  eventDescriptions: {
    'mth-change': 'Dispatched when the user selects or clears a rating.',
  },
  cssProperties: [
    { name: '--mth-rating-color-empty', description: 'Unfilled star color.', default: 'var(--mth-color-border-strong)' },
    { name: '--mth-rating-color-filled', description: 'Filled star color.', default: 'oklch(0.75 0.17 75)' },
  ],
};
