import type { ComponentBehaviorSpec } from '@methane-ui/spec-compiler';
import { schemaFormMessages } from './schema-form.messages.js';

export const schemaFormSpec: ComponentBehaviorSpec = {
  tag: 'mth-schema-form',
  package: '@methane-ui/ui',
  conformance: [],
  controllers: ['ContextProtocol'],
  focusModel: 'none',
  states: ['submitting', 'invalid', 'submitted'],
  keyboard: [
    { key: 'Enter', when: 'focused inside form control', expect: 'validates schema and dispatches mth-submit or mth-invalid' },
  ],
  props: [
    { name: 'schemaJson', attr: 'schema-json', type: 'string', default: '' },
    { name: 'submitLabel', attr: 'submit-label', type: 'string', default: '' },
    { name: 'showReset', attr: 'show-reset', type: 'boolean', default: false },
    { name: 'disabled', attr: 'disabled', type: 'boolean', default: false },
    { name: 'readonly', attr: 'readonly', type: 'boolean', default: false },
  ],
  events: [
    { name: 'mth-input', cancelable: false, detailType: '{ values: Record<string, unknown>; valid: boolean }' },
    { name: 'mth-change', cancelable: false, detailType: '{ values: Record<string, unknown>; valid: boolean }' },
    { name: 'mth-submit', cancelable: true, detailType: '{ values: Record<string, unknown>; valid: boolean }' },
    { name: 'mth-invalid', cancelable: false, detailType: '{ errors: Record<string, string> }' },
  ],
  slots: [
    { name: 'header', description: 'Optional heading slot above generated fields.' },
    { name: 'actions', description: 'Optional extra action controls beside submit/reset.' },
  ],
  parts: [
    { name: 'base', description: 'Generated `<form>` element.' },
    { name: 'title', description: 'Schema title heading.' },
    { name: 'description', description: 'Schema description paragraph.' },
    { name: 'fields', description: 'Field stack container.' },
    { name: 'actions', description: 'Form action row.' },
    { name: 'submit', description: 'Submit button.' },
    { name: 'reset', description: 'Optional reset button.' },
  ],
  messages: { ...schemaFormMessages },
};

export const CEM_METADATA = {
  description:
    'Declarative JSON-Schema-subset form renderer emitting public `<mth-field>` and `<mth-input>` controls with schema constraint validation and `FORM_CONTEXT` propagation.',
  propDescriptions: {
    schemaJson: 'JSON-serialized form schema string for declarative HTML/SSR usage.',
    submitLabel: 'Custom text for the submit button.',
    showReset: 'Renders a form reset button.',
    disabled: 'Disables all generated fields and submission via `FORM_CONTEXT`.',
    readonly: 'Propagates read-only state via `FORM_CONTEXT`.',
  },
  eventDescriptions: {
    'mth-input': 'Fired synchronously when any generated field updates.',
    'mth-change': 'Fired when a field commits a value change.',
    'mth-submit': 'Cancelable event fired when schema validation succeeds on submit.',
    'mth-invalid': 'Fired on submit when schema constraint validation fails.',
  },
  cssProperties: [
    { name: '--mth-color-surface', description: 'Form container background.' },
    { name: '--mth-color-accent', description: 'Submit button accent background.' },
    { name: '--mth-color-border', description: 'Border color.' },
    { name: '--mth-radius-lg', description: 'Container corner radius.' },
  ],
};
