import type { ComponentBehaviorSpec } from '@methane-ui/spec-compiler';
import { newsletterFormMessages } from './newsletter-form.messages.js';

export const newsletterFormSpec: ComponentBehaviorSpec = {
  tag: 'mth-newsletter-form',
  package: '@methane-ui/ui',
  conformance: ['form-control'],
  controllers: ['FormControlController', 'InputController'],
  focusModel: 'delegates-focus',
  states: ['submitted', 'invalid', 'disabled'],
  keyboard: [{ key: 'Enter', when: 'email input focused', expect: 'Validates and submits the newsletter subscription.' }],
  props: [
    { name: 'value', attr: 'value', type: 'string', default: '' },
    { name: 'name', attr: 'name', type: 'string', default: 'email' },
    { name: 'heading', attr: 'heading', type: 'string', default: '' },
    { name: 'placeholder', attr: 'placeholder', type: 'string', default: '' },
    { name: 'submitLabel', attr: 'submit-label', type: 'string', default: '' },
    { name: 'required', attr: 'required', type: 'boolean', default: true },
    { name: 'disabled', attr: 'disabled', type: 'boolean', default: false },
    { name: 'submitted', attr: 'submitted', type: 'boolean', default: false },
  ],
  events: [
    { name: 'input', cancelable: false, detailType: 'undefined' },
    { name: 'change', cancelable: false, detailType: 'undefined' },
    { name: 'mth-submit', cancelable: true, detailType: '{ email: string }' },
  ],
  slots: [
    { name: '', description: 'Optional consent checkbox or extra form copy.' },
    { name: 'header', description: 'Optional custom heading/description block.' },
  ],
  parts: [
    { name: 'base', description: 'Form container wrapper.' },
    { name: 'heading', description: 'Newsletter form heading.' },
    { name: 'description', description: 'Supporting subtitle text.' },
    { name: 'controls', description: 'Input and submit button row.' },
    { name: 'input', description: 'Email `<input>` control.' },
    { name: 'submit-button', description: 'Subscription submit button.' },
    { name: 'status', description: 'Validation error or confirmation status region.' },
  ],
  messages: { ...newsletterFormMessages },
};

export const CEM_METADATA = {
  description:
    'Form-associated (`ElementInternals`) newsletter signup widget composing `FormControlController` and `InputController` with email constraint validation and `mth-submit` event.',
  propDescriptions: {
    value: 'Current email input value synchronized with the host form.',
    name: 'Form field name submitted to parent `<form>`.',
    heading: 'Optional heading overriding the default localized title.',
    placeholder: 'Placeholder text for the email input.',
    submitLabel: 'Custom submit button label.',
    required: 'Marks the email field as required.',
    disabled: 'Disables the email input and submit button.',
    submitted: 'Displays the confirmation status banner after submission.',
  },
  eventDescriptions: {
    input: 'Fired when the email value changes during typing.',
    change: 'Fired when the email value commits.',
    'mth-submit': 'Cancelable event fired with `{ email }` when valid email submission occurs.',
  },
  cssProperties: [
    { name: '--mth-color-surface', description: 'Container surface color' },
    { name: '--mth-color-fg', description: 'Foreground text color' },
    { name: '--mth-color-border', description: 'Border color' },
    { name: '--mth-color-accent', description: 'Submit button background color' },
    { name: '--mth-color-accent-fg', description: 'Submit button text color' },
    { name: '--mth-color-danger', description: 'Validation error text color' },
    { name: '--mth-color-success', description: 'Confirmation text color' },
  ],
};
