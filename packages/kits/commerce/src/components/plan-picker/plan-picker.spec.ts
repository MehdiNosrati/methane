import type { ComponentBehaviorSpec } from '@methane/spec-compiler';
import { planPickerMessages } from './plan-picker.messages.js';

export const planPickerSpec: ComponentBehaviorSpec = {
  tag: 'mth-plan-picker',
  package: '@methane/commerce',
  conformance: ['form-control', 'roving-focus'],
  controllers: ['FormControlController', 'SelectionController', 'RovingFocusController'],
  focusModel: 'host',
  states: ['annual', 'disabled'],
  keyboard: [
    { key: 'ArrowRight', when: 'plan card focused', expect: 'Focus next plan tier card (previous in RTL).' },
    { key: 'ArrowLeft', when: 'plan card focused', expect: 'Focus previous plan tier card (next in RTL).' },
    { key: 'Home', when: 'plan card focused', expect: 'Focus first plan tier card.' },
    { key: 'End', when: 'plan card focused', expect: 'Focus last plan tier card.' },
    { key: 'Enter', when: 'plan card focused', expect: 'Select focused plan tier.' },
  ],
  props: [
    { name: 'plans', attr: false, type: 'ReadonlyArray<BillingPlan>' },
    { name: 'value', attr: 'value', type: 'string', default: '' },
    { name: 'billingCycle', attr: 'billing-cycle', type: "'monthly' | 'annual'", default: 'monthly' },
    { name: 'currency', attr: 'currency', type: 'string', default: 'USD' },
    { name: 'locale', attr: 'locale', type: 'string', default: '' },
    { name: 'name', attr: 'name', type: 'string', default: '' },
    { name: 'label', attr: 'label', type: 'string', default: '' },
    { name: 'disabled', attr: 'disabled', type: 'boolean', default: false },
    { name: 'required', attr: 'required', type: 'boolean', default: false },
  ],
  events: [
    {
      name: 'mth-change',
      cancelable: false,
      detailType: '{ planId: string; billingCycle: "monthly" | "annual" }',
    },
    {
      name: 'mth-cycle-change',
      cancelable: false,
      detailType: '{ billingCycle: "monthly" | "annual" }',
    },
  ],
  slots: [],
  parts: [
    { name: 'base', description: 'Root plan picker container.' },
    { name: 'cycle-toggle', description: 'Monthly vs annual billing interval switch group.' },
    { name: 'grid', description: 'Radiogroup container for plan cards.' },
    { name: 'plan', description: 'Selectable plan tier radio button card.' },
  ],
  messages: { ...planPickerMessages },
};

export const CEM_METADATA = {
  description:
    'Form-associated SaaS subscription plan picker with monthly/annual billing toggle, SelectionController + RovingFocusController, and Intl currency formatting.',
  propDescriptions: {
    plans: 'Array of BillingPlan tier definitions.',
    value: 'Currently selected plan ID.',
    billingCycle: 'Active billing interval: monthly or annual.',
    currency: 'ISO 4217 currency code passed to Intl.NumberFormat.',
    locale: 'Optional BCP 47 locale override; defaults to UIElement resolvedLocale.',
    name: 'Form field name submitted via FormData.',
    label: 'Accessible region label overriding localized default.',
    disabled: 'Disables billing cycle toggle and plan tier selection.',
    required: 'Enforces a selected plan tier during constraint validation.',
  },
  cssProperties: [
    { name: '--mth-color-accent', description: 'Selected plan ring and featured badge accent.' },
    { name: '--mth-color-surface', description: 'Plan card surface background.' },
    { name: '--mth-color-border', description: 'Plan card border color.' },
  ],
};
