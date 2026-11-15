import type { ComponentBehaviorSpec } from '@methane/spec-compiler';
import { formulaBarMessages } from './formula-bar.messages.js';

export const formulaBarSpec: ComponentBehaviorSpec = {
  tag: 'mth-formula-bar',
  package: '@methane/spreadsheet',
  conformance: ['satellite', 'form-control'],
  controllers: ['FormControlController', 'InputController'],
  focusModel: 'delegates-focus',
  states: ['disabled', 'readonly', 'invalid', 'formula'],
  keyboard: [
    { key: 'Enter', when: 'formula input focused', expect: 'commits formula and emits mth-formula-commit' },
    { key: 'Escape', when: 'formula input focused', expect: 'reverts formula draft to committed value' },
  ],
  props: [
    { name: 'name', attr: 'name', type: 'string', default: '' },
    { name: 'value', attr: 'value', type: 'string', default: '' },
    { name: 'cellAddress', attr: 'cell-address', type: 'string', default: 'A1' },
    { name: 'placeholder', attr: 'placeholder', type: 'string', default: '' },
    { name: 'disabled', attr: 'disabled', type: 'boolean', default: false },
    { name: 'required', attr: 'required', type: 'boolean', default: false },
    { name: 'readonly', attr: 'readonly', type: 'boolean', default: false },
    { name: 'label', attr: 'label', type: 'string', default: '' },
  ],
  events: [
    {
      name: 'mth-formula-input',
      cancelable: false,
      detailType: '{ cellAddress: string; value: string; dependencies: ReadonlyArray<string> }',
    },
    {
      name: 'mth-formula-commit',
      cancelable: false,
      detailType: '{ cellAddress: string; value: string; valid: boolean }',
    },
  ],
  slots: [{ name: 'fallback', description: 'Declarative SSR fallback input markup.' }],
  parts: [
    { name: 'base', description: 'Outer formula bar container.' },
    { name: 'address', description: 'Read-only active cell address indicator.' },
    { name: 'fx', description: 'Formula indicator glyph.' },
    { name: 'input', description: 'Formula text input control.' },
    { name: 'commit', description: 'Apply formula button.' },
  ],
  messages: { ...formulaBarMessages },
};

export const CEM_METADATA = {
  description:
    'Spreadsheet formula bar satellite with FACE form integration, live Formula AST dependency inspection, and IME-safe InputController editing.',
  propDescriptions: {
    name: 'Form field name submitted with parent form.',
    value: 'Current cell value or formula string.',
    cellAddress: 'Active cell reference displayed in the address box.',
    placeholder: 'Optional placeholder override.',
    disabled: 'Disables editing and excludes control from form submission.',
    required: 'Requires non-empty formula or value.',
    readonly: 'Prevents editing while preserving selection and form value.',
    label: 'Accessible formula bar label.',
  },
  eventDescriptions: {
    'mth-formula-input': 'Fired as the formula text changes.',
    'mth-formula-commit': 'Fired when the user presses Enter or activates Apply.',
  },
  cssProperties: [
    { name: '--mth-color-surface', description: 'Formula bar background.' },
    { name: '--mth-color-bg-subtle', description: 'Address box background.' },
    { name: '--mth-color-border', description: 'Input border color.' },
    { name: '--mth-color-accent', description: 'Focus and fx badge accent.' },
  ],
};
