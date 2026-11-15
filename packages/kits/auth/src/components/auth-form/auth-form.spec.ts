import type { ComponentBehaviorSpec } from '@methane/spec-compiler';
import { authFormMessages } from './auth-form.messages.js';

export const authFormSpec: ComponentBehaviorSpec = {
  tag: 'mth-auth-form',
  package: '@methane/auth',
  conformance: ['form-control'],
  controllers: ['FormControlController', 'InputController'],
  focusModel: 'delegates-focus',
  states: ['disabled', 'invalid', 'loading', 'dirty', 'touched'],
  keyboard: [],
  props: [
    {
      name: 'mode',
      attr: 'mode',
      type: "'signin' | 'signup' | 'reset' | 'magic-link'",
      default: 'signin',
    },
    { name: 'value', attr: 'value', type: 'string', default: '' },
    { name: 'name', attr: 'name', type: 'string', default: '' },
    { name: 'email', attr: 'email', type: 'string', default: '' },
    { name: 'password', attr: 'password', type: 'string', default: '' },
    { name: 'fullName', attr: 'full-name', type: 'string', default: '' },
    { name: 'error', attr: 'error', type: 'string', default: '' },
    { name: 'loading', attr: 'loading', type: 'boolean', default: false },
    { name: 'disabled', attr: 'disabled', type: 'boolean', default: false },
    { name: 'required', attr: 'required', type: 'boolean', default: true },
    { name: 'submitLabel', attr: 'submit-label', type: 'string', default: '' },
  ],
  events: [
    {
      name: 'mth-submit',
      cancelable: true,
      detailType: "{ mode: string; email: string; password: string; fullName: string }",
    },
    {
      name: 'mth-change',
      cancelable: false,
      detailType: '{ email: string; password: string; fullName: string }',
    },
  ],
  slots: [
    { name: 'header', description: 'Optional header branding or mode switch tabs.' },
    { name: 'footer', description: 'Optional helper links below the submit button.' },
  ],
  parts: [
    { name: 'base', description: 'Outer form container card.' },
    { name: 'heading', description: 'Mode title heading.' },
    { name: 'email-input', description: 'Email input with `autocomplete="email"`.' },
    { name: 'password-input', description: 'Password input with contextual `autocomplete`.' },
    { name: 'error', description: 'Error alert banner wrapper.' },
    { name: 'submit-button', description: 'Primary submit button.' },
  ],
  messages: { ...authFormMessages },
};

export const CEM_METADATA = {
  description:
    'Authentication form supporting sign-in, sign-up, password reset, and magic-link modes with autofill-compatible `autocomplete`, FormControlController validation, and alert error display.',
  propDescriptions: {
    mode: 'Form flow mode (`signin` | `signup` | `reset` | `magic-link`).',
    value: 'Form-associated primary email value.',
    name: 'Form field name submitted via ElementInternals.',
    email: 'Bound email input value.',
    password: 'Bound password input value.',
    fullName: 'Full name value displayed in `signup` mode.',
    error: 'External authentication error message shown in `<mth-alert>`.',
    loading: 'Disables controls and shows loading state on submit.',
    disabled: 'Disables all form controls.',
    required: 'Marks email (and password when applicable) as required.',
    submitLabel: 'Optional custom submit button label.',
  },
  eventDescriptions: {
    'mth-submit': 'Cancelable submit event emitted when client validation passes.',
    'mth-change': 'Fired when any credential field changes.',
  },
  cssProperties: [
    { name: '--mth-color-surface', description: 'Auth card background color.' },
    { name: '--mth-color-border-focus', description: 'Input focus outline color.' },
    { name: '--mth-radius-lg', description: 'Auth card corner radius.' },
  ],
};
