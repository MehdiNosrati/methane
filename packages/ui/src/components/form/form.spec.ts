import type { ComponentBehaviorSpec } from '@methane-ui/spec-compiler';
import { formMessages } from './form.messages.js';

export const formSpec: ComponentBehaviorSpec = {
  tag: 'mth-form',
  package: '@methane-ui/ui',
  conformance: [],
  controllers: ['FormContextProviderController', 'ContextProtocol'],
  focusModel: 'none',
  states: ['submitting', 'disabled', 'readonly', 'invalid'],
  keyboard: [
    {
      key: 'Enter',
      when: 'focus inside non-textarea single-line control',
      expect: 'triggers form requestSubmit and validates child controls',
    },
  ],
  props: [
    { name: 'novalidate', attr: 'novalidate', type: 'boolean', default: false },
    { name: 'submitting', attr: 'submitting', type: 'boolean', default: false },
    { name: 'disabled', attr: 'disabled', type: 'boolean', default: false },
    { name: 'readonly', attr: 'readonly', type: 'boolean', default: false },
  ],
  events: [
    {
      name: 'mth-submit',
      cancelable: true,
      detailType: '{ values: Record<string, string | ReadonlyArray<string>> }',
    },
    {
      name: 'mth-invalid',
      cancelable: false,
      detailType:
        '{ errors: ReadonlyArray<{ readonly id: string; readonly name: string; readonly message: string; readonly label?: string }> }',
    },
  ],
  slots: [{ name: '', description: 'Form controls, fieldsets, and submit actions.' }],
  parts: [{ name: 'form', description: 'Shadow `<form>` container element.' }],
  messages: { ...formMessages },
};

export const CEM_METADATA = {
  description:
    'Form coordinator providing FormContext to child controls, validating FACE elements, and emitting mth-submit / mth-invalid events.',
  propDescriptions: {
    novalidate: 'Bypasses constraint validation before emitting mth-submit.',
    submitting: 'Marks the form as submitting and propagates disabled state via FormContext.',
    disabled: 'Disables all enclosed form controls via FormContext.',
    readonly: 'Propagates read-only state to enclosed form controls via FormContext.',
  },
  eventDescriptions: {
    'mth-submit':
      'Fired with serialized child control values when validation succeeds (or novalidate is set).',
    'mth-invalid': 'Fired with collected control errors when submission validation fails.',
  },
  cssProperties: [
    { name: '--mth-font-sans', description: 'Base font family for form layout.' },
    { name: '--mth-color-fg', description: 'Primary foreground color.' },
    { name: '--mth-space-4', description: 'Vertical stack gap between form rows.' },
  ],
};
