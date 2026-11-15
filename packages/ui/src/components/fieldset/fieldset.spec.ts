import type { ComponentBehaviorSpec } from '@methane-ui/spec-compiler';
import { fieldsetMessages } from './fieldset.messages.js';

export const fieldsetSpec: ComponentBehaviorSpec = {
  tag: 'mth-fieldset',
  package: '@methane-ui/ui',
  conformance: [],
  controllers: ['FormContextProviderController', 'ContextProtocol'],
  focusModel: 'none',
  states: ['disabled', 'invalid'],
  keyboard: [],
  props: [
    { name: 'legend', attr: 'legend', type: 'string', default: '' },
    { name: 'hint', attr: 'hint', type: 'string', default: '' },
    { name: 'error', attr: 'error', type: 'string', default: '' },
    { name: 'disabled', attr: 'disabled', type: 'boolean', default: false },
  ],
  events: [],
  slots: [
    { name: '', description: 'Form fields and controls grouped inside the fieldset.' },
    { name: 'legend', description: 'Rich custom legend content.' },
    { name: 'hint', description: 'Helper text describing the grouped controls.' },
    { name: 'error', description: 'Group-level validation error content.' },
  ],
  parts: [
    { name: 'fieldset', description: 'Native `<fieldset>` grouping element in shadow DOM.' },
    { name: 'legend', description: 'Native `<legend>` element labelling the fieldset.' },
    { name: 'body', description: 'Content wrapper for slotted form controls.' },
    { name: 'hint', description: 'Group helper text container.' },
    { name: 'error', description: 'Group validation error container.' },
  ],
  messages: { ...fieldsetMessages },
};

export const CEM_METADATA = {
  description:
    'Semantic form grouping container rendering a shadow `<fieldset>` and `<legend>` with FormContext disabled propagation.',
  propDescriptions: {
    legend: 'Text displayed inside the fieldset `<legend>`.',
    hint: 'Supplementary helper text for the group.',
    error: 'Group-level validation error message.',
    disabled: 'Disables all enclosed form controls via shadow fieldset and FormContext.',
  },
  eventDescriptions: {},
  cssProperties: [
    { name: '--mth-color-fg', description: 'Primary foreground color.' },
    { name: '--mth-color-fg-muted', description: 'Muted hint text color.' },
    { name: '--mth-color-border', description: 'Fieldset border color.' },
    { name: '--mth-color-danger', description: 'Invalid border and error text color.' },
    { name: '--mth-radius-md', description: 'Fieldset border radius.' },
  ],
};
