import type { ComponentBehaviorSpec } from '@methane/spec-compiler';
import { checkoutStepsMessages } from './checkout-steps.messages.js';

export const checkoutStepsSpec: ComponentBehaviorSpec = {
  tag: 'mth-checkout-steps',
  package: '@methane/commerce',
  conformance: ['roving-focus'],
  controllers: ['RovingFocusController'],
  focusModel: 'host',
  states: ['vertical', 'linear'],
  keyboard: [
    { key: 'ArrowRight', when: 'horizontal', expect: 'Move focus to next step (previous in RTL).' },
    { key: 'ArrowLeft', when: 'horizontal', expect: 'Move focus to previous step (next in RTL).' },
    { key: 'ArrowDown', when: 'vertical', expect: 'Move focus to next step in vertical orientation.' },
    { key: 'ArrowUp', when: 'vertical', expect: 'Move focus to previous step in vertical orientation.' },
    { key: 'Home', when: 'focused', expect: 'Focus first step.' },
    { key: 'End', when: 'focused', expect: 'Focus last step.' },
    { key: 'Enter', when: 'step-button focused', expect: 'Activate unlocked step.' },
  ],
  props: [
    { name: 'steps', attr: false, type: 'ReadonlyArray<CheckoutStep>' },
    { name: 'activeStep', attr: 'active-step', type: 'string', default: '' },
    { name: 'orientation', attr: 'orientation', type: "'horizontal' | 'vertical'", default: 'horizontal' },
    { name: 'linear', attr: 'linear', type: 'boolean', default: true },
    { name: 'label', attr: 'label', type: 'string', default: '' },
  ],
  events: [
    {
      name: 'mth-step-change',
      cancelable: false,
      detailType: '{ stepId: string; index: number }',
    },
    {
      name: 'mth-step-complete',
      cancelable: false,
      detailType: '{ stepId: string }',
    },
  ],
  slots: [],
  parts: [
    { name: 'base', description: 'Root navigation list container.' },
    { name: 'step', description: 'Individual step list item.' },
    { name: 'step-button', description: 'Focusable step trigger button.' },
    { name: 'indicator', description: 'Step number or completion indicator.' },
    { name: 'label', description: 'Step label text.' },
  ],
  messages: { ...checkoutStepsMessages },
};

export const CEM_METADATA = {
  description:
    'Multi-step checkout progress coordinator supporting linear completion gating, vertical/horizontal layouts, and RTL roving focus.',
  propDescriptions: {
    steps: 'Ordered list of CheckoutStep items (shipping, delivery, payment, review).',
    activeStep: 'Currently active step ID.',
    orientation: 'Step list orientation: horizontal or vertical.',
    linear: 'When true, prevents activating steps ahead of incomplete preceding steps.',
    label: 'Accessible navigation label overriding localized default.',
  },
  cssProperties: [
    { name: '--mth-color-accent', description: 'Active and completed step indicator accent.' },
    { name: '--mth-color-border', description: 'Step connector and card border color.' },
    { name: '--mth-color-danger', description: 'Step validation error accent color.' },
  ],
};
