import type { ComponentBehaviorSpec } from '@methane-ui/spec-compiler';
import { fieldMessages } from './field.messages.js';

export const fieldSpec: ComponentBehaviorSpec = {
  tag: 'mth-field',
  package: '@methane-ui/ui',
  conformance: [],
  controllers: ['ContextProtocol'],
  focusModel: 'none',
  states: ['required', 'disabled', 'invalid'],
  keyboard: [],
  props: [
    { name: 'label', attr: 'label', type: 'string', default: '' },
    { name: 'hint', attr: 'hint', type: 'string', default: '' },
    { name: 'error', attr: 'error', type: 'string', default: '' },
    { name: 'required', attr: 'required', type: 'boolean', default: false },
    { name: 'disabled', attr: 'disabled', type: 'boolean', default: false },
    {
      name: 'density',
      attr: 'density',
      type: "'compact' | 'default' | 'comfortable'",
      default: 'default',
    },
  ],
  events: [],
  slots: [
    { name: '', description: 'Slotted Methane form control.' },
    { name: 'label', description: 'Optional custom label content propagated via Context Protocol.' },
    { name: 'hint', description: 'Optional helper text propagated via Context Protocol.' },
    { name: 'error', description: 'Optional error text propagated via Context Protocol.' },
  ],
  parts: [
    { name: 'base', description: 'Outer field layout container.' },
    { name: 'label', description: 'Field label wrapper.' },
    { name: 'control', description: 'Slotted control container.' },
    { name: 'hint', description: 'Field hint wrapper.' },
    { name: 'error', description: 'Field error wrapper.' },
  ],
  messages: { ...fieldMessages },
};

export const CEM_METADATA = {
  description: 'Layout wrapper and Community Context Protocol provider for Methane form controls.',
  propDescriptions: {
    label: 'Field label text propagated to child controls via FieldContext.',
    hint: 'Helper description text propagated via FieldContext.',
    error: 'Validation error message propagated via FieldContext.',
    required: 'Marks the field required and propagates via FieldContext.',
    disabled: 'Disables descendant Methane controls via FieldContext.',
    density: 'Density scale override for layout spacing.',
  },
  cssProperties: [
    { name: '--mth-space-control-gap', description: 'Gap between label, control, hint, and error.' },
    { name: '--mth-color-fg', description: 'Label text color.' },
    { name: '--mth-color-fg-muted', description: 'Hint text color.' },
    { name: '--mth-color-danger', description: 'Error text color.' },
  ],
};
