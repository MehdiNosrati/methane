import type { ComponentBehaviorSpec } from '@methane/spec-compiler';
import { paymentFormMessages } from './payment-form.messages.js';

export const paymentFormSpec: ComponentBehaviorSpec = {
  tag: 'mth-payment-form',
  package: '@methane/commerce',
  conformance: ['form-control'],
  controllers: ['FormControlController', 'InputController', 'MaskAndFormatEngine'],
  focusModel: 'none',
  states: ['disabled', 'invalid'],
  keyboard: [{ key: 'Enter', when: 'input focused', expect: 'Validate and submit payment form.' }],
  props: [
    { name: 'value', attr: 'value', type: 'string', default: '' },
    { name: 'name', attr: 'name', type: 'string', default: '' },
    { name: 'amount', attr: 'amount', type: 'number', default: 0 },
    { name: 'currency', attr: 'currency', type: 'string', default: 'USD' },
    { name: 'locale', attr: 'locale', type: 'string', default: '' },
    { name: 'submitLabel', attr: 'submit-label', type: 'string', default: '' },
    { name: 'disabled', attr: 'disabled', type: 'boolean', default: false },
    { name: 'required', attr: 'required', type: 'boolean', default: false },
  ],
  events: [
    {
      name: 'mth-change',
      cancelable: false,
      detailType: '{ cardholderName: string; last4: string; valid: boolean }',
    },
    {
      name: 'mth-submit',
      cancelable: false,
      detailType: '{ cardholderName: string; last4: string; expiry: string; valid: boolean }',
    },
  ],
  slots: [{ name: 'footer', description: 'Optional trust badges or terms note.' }],
  parts: [
    { name: 'base', description: 'Root payment form container.' },
    { name: 'name-input', description: 'Cardholder name input.' },
    { name: 'number-input', description: 'Masked card number input.' },
    { name: 'expiry-input', description: 'MM/YY expiry input.' },
    { name: 'cvc-input', description: 'Security code input.' },
    { name: 'submit-button', description: 'Primary submit button.' },
    { name: 'error', description: 'Validation error summary.' },
  ],
  messages: { ...paymentFormMessages },
};

export const CEM_METADATA = {
  description:
    'Form-associated payment card entry form using MaskAndFormatEngine + Luhn validation, proper cc-* autocomplete hints, and non-PAN submission detail.',
  propDescriptions: {
    value: 'Form-associated cardholder name value submitted in FormData.',
    name: 'Form field name submitted via FormData.',
    amount: 'Optional order total formatted onto the submit CTA.',
    currency: 'ISO 4217 currency code passed to Intl.NumberFormat.',
    locale: 'Optional BCP 47 locale override; defaults to UIElement resolvedLocale.',
    submitLabel: 'Overrides localized submit button label.',
    disabled: 'Disables all payment inputs and submit action.',
    required: 'Enforces required cardholder constraint validation.',
  },
  cssProperties: [
    { name: '--mth-color-surface', description: 'Payment form background.' },
    { name: '--mth-color-border', description: 'Field border color.' },
    { name: '--mth-color-danger', description: 'Validation error border and message color.' },
  ],
};
