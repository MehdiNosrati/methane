import type { ComponentBehaviorSpec } from '@methane/spec-compiler';
import { tagInputMessages } from './tag-input.messages.js';

export const tagInputSpec: ComponentBehaviorSpec = {
  tag: 'mth-tag-input',
  package: '@methane/ui',
  conformance: ['form-control'],
  controllers: ['FormControlController'],
  focusModel: 'delegates-focus',
  states: ['dirty', 'touched', 'user-invalid', 'disabled', 'required'],
  keyboard: [
    { key: 'Enter', when: 'input has text', expect: 'commits new tag chip and clears input' },
    { key: 'Backspace', when: 'input empty and tags present', expect: 'removes last tag chip' },
  ],
  props: [
    { name: 'name', attr: 'name', type: 'string', default: '' },
    { name: 'value', attr: 'value', type: 'string', default: '' },
    { name: 'defaultValue', attr: 'default-value', type: 'string', default: '' },
    { name: 'maxTags', attr: 'max-tags', type: 'number', default: 0 },
    { name: 'allowDuplicates', attr: 'allow-duplicates', type: 'boolean', default: false },
    { name: 'delimiter', attr: 'delimiter', type: 'string', default: ',' },
    { name: 'label', attr: 'label', type: 'string', default: '' },
    { name: 'placeholder', attr: 'placeholder', type: 'string', default: 'Add tag...' },
    { name: 'hint', attr: 'hint', type: 'string', default: '' },
    { name: 'error', attr: 'error', type: 'string', default: '' },
    { name: 'disabled', attr: 'disabled', type: 'boolean', default: false },
    { name: 'readonly', attr: 'readonly', type: 'boolean', default: false },
    { name: 'required', attr: 'required', type: 'boolean', default: false },
  ],
  events: [
    { name: 'mth-change', cancelable: false, detailType: '{ value: string; values: ReadonlyArray<string> }' },
    { name: 'mth-tag-add', cancelable: false, detailType: '{ tag: string; values: ReadonlyArray<string> }' },
    { name: 'mth-tag-remove', cancelable: false, detailType: '{ tag: string; index: number; values: ReadonlyArray<string> }' },
  ],
  slots: [
    { name: 'label', description: 'Field label.' },
    { name: 'hint', description: 'Helper text.' },
    { name: 'error', description: 'Error text.' },
  ],
  parts: [
    { name: 'base', description: 'Outer wrapper.' },
    { name: 'label', description: 'Field label.' },
    { name: 'control', description: 'Bordered container holding tags and input.' },
    { name: 'tag', description: 'Tag chip.' },
    { name: 'tag-remove', description: 'Chip remove button.' },
    { name: 'input', description: 'Tag entry input.' },
    { name: 'hint', description: 'Helper message.' },
    { name: 'error', description: 'Error message.' },
  ],
  messages: { ...tagInputMessages },
};

export const CEM_METADATA = {
  description:
    'Form-associated inline tag chip editor supporting delimiter splitting, paste parsing, Backspace deletion, duplicate guards, and max-tags limits.',
  propDescriptions: {
    name: 'Form field name.',
    value: 'Comma-separated string of entered tags.',
    defaultValue: 'Initial comma-separated tag value for form reset.',
    values: 'Array representation of current tags.',
    maxTags: 'Maximum number of tags allowed (0 for unlimited).',
    allowDuplicates: 'Allows duplicate tag values.',
    delimiters: 'Delimiter characters that commit a tag while typing or pasting.',
    label: 'Accessible field label.',
    placeholder: 'Input placeholder text.',
    hint: 'Helper message.',
    error: 'Validation error message.',
    disabled: 'Disables editing and removal.',
    readonly: 'Prevents adding or removing tags.',
    required: 'Requires at least one tag for validity.',
  },
  eventDescriptions: {
    'mth-change': 'Fired when the tag list changes.',
    'mth-tag-add': 'Fired when a tag is added.',
    'mth-tag-remove': 'Fired when a tag is removed.',
  },
  cssProperties: [
    { name: '--mth-tag-input-bg', description: 'Control background.', default: 'var(--mth-color-surface)' },
    { name: '--mth-tag-input-border', description: 'Control border.', default: 'var(--mth-color-border)' },
    { name: '--mth-tag-input-chip-bg', description: 'Tag chip background.', default: 'var(--mth-color-accent-subtle)' },
  ],
};
