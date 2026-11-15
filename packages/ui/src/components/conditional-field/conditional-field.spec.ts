import type { ComponentBehaviorSpec } from '@methane/spec-compiler';
import { conditionalFieldMessages } from './conditional-field.messages.js';

export const conditionalFieldSpec: ComponentBehaviorSpec = {
  tag: 'mth-conditional-field',
  package: '@methane/ui',
  conformance: [],
  controllers: ['ContextProtocol'],
  focusModel: 'none',
  states: ['matched', 'hidden-branch'],
  keyboard: [],
  props: [
    { name: 'field', attr: 'field', type: 'string', default: '' },
    { name: 'equals', attr: 'equals', type: 'string', default: '' },
    { name: 'operator', attr: 'operator', type: "'eq' | 'neq' | 'truthy' | 'empty' | 'in'", default: 'eq' },
    { name: 'mode', attr: 'mode', type: "'hide' | 'disable'", default: 'hide' },
    { name: 'disableWhenHidden', attr: 'disable-when-hidden', type: 'boolean', default: true },
  ],
  events: [
    { name: 'mth-condition-change', cancelable: false, detailType: '{ matched: boolean }' },
  ],
  slots: [
    { name: 'default', description: 'Conditionally displayed or enabled form fields.' },
  ],
  parts: [
    { name: 'base', description: 'Outer conditional wrapper.' },
  ],
  messages: { ...conditionalFieldMessages },
};

export const CEM_METADATA = {
  description:
    'FormContext-reactive conditional container that shows/hides or disables descendant form controls based on form state, field predicates, or attribute rules.',
  propDescriptions: {
    field: 'Target form control name within the owning form or `values` map.',
    equals: 'Expected comparison value (or comma-separated values for `operator="in"`).',
    operator: 'Comparison operator (`eq | neq | truthy | empty | in`).',
    mode: 'When condition fails, either hides (`hide`) or keeps visible and disables descendants via `FORM_CONTEXT` (`disable`).',
    disableWhenHidden: 'Automatically propagates `FORM_CONTEXT.disabled = true` while hidden.',
  },
  eventDescriptions: {
    'mth-condition-change': 'Fired when evaluated condition match state transitions.',
  },
  cssProperties: [
    { name: '--mth-motion-duration-fast', description: 'Optional fade/transition duration.' },
  ],
};
