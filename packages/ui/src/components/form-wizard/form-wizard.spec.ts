import type { ComponentBehaviorSpec } from '@methane/spec-compiler';
import { formWizardMessages } from './form-wizard.messages.js';

export const formWizardSpec: ComponentBehaviorSpec = {
  tag: 'mth-form-wizard',
  package: '@methane/ui',
  conformance: [],
  controllers: ['SelectionController', 'SlotCollectionController'],
  focusModel: 'none',
  states: ['completed'],
  keyboard: [
    { key: 'Enter', when: 'next/submit button focused', expect: 'validates current step and advances or completes wizard' },
  ],
  props: [
    { name: 'activeStep', attr: 'active-step', type: 'number', default: 0 },
    { name: 'step', attr: 'step', type: 'string', default: '' },
    { name: 'label', attr: 'label', type: 'string', default: '' },
    { name: 'linear', attr: 'linear', type: 'boolean', default: true },
    { name: 'validateOnNext', attr: 'validate-on-next', type: 'boolean', default: true },
    { name: 'backLabel', attr: 'back-label', type: 'string', default: '' },
    { name: 'nextLabel', attr: 'next-label', type: 'string', default: '' },
    { name: 'submitLabel', attr: 'submit-label', type: 'string', default: '' },
  ],
  events: [
    { name: 'mth-step-change', cancelable: true, detailType: '{ index: number; previousIndex: number; step: string }' },
    { name: 'mth-complete', cancelable: false, detailType: '{ steps: number }' },
  ],
  slots: [
    { name: 'default', description: 'Step panel elements (with optional `data-step` and `data-title` attributes).' },
    { name: 'actions', description: 'Optional extra action controls.' },
  ],
  parts: [
    { name: 'base', description: 'Outer wizard container.' },
    { name: 'steps', description: 'Step progress navigation list.' },
    { name: 'step', description: 'Individual step button in the progress bar.' },
    { name: 'panel', description: 'Active step slot viewport.' },
    { name: 'error', description: 'Step validation banner.' },
    { name: 'actions', description: 'Wizard navigation footer.' },
    { name: 'back', description: 'Previous step button.' },
    { name: 'next', description: 'Next / Finish action button.' },
  ],
  messages: { ...formWizardMessages },
};

export const CEM_METADATA = {
  description:
    'Multi-step form wizard coordinating Light-DOM step panels via `SelectionController` and `SlotCollectionController` with per-step validation gates.',
  propDescriptions: {
    activeStep: 'Zero-based index of the currently active step.',
    step: 'Identifier (`data-step` or `id`) of the currently selected step.',
    label: 'Accessible region label for the wizard.',
    linear: 'When true, prevents skipping ahead past steps that have not been reached.',
    validateOnNext: 'Runs constraint validity checks on active step controls before advancing.',
    backLabel: 'Custom Back button label.',
    nextLabel: 'Custom Next button label.',
    submitLabel: 'Custom Finish button label on the final step.',
  },
  eventDescriptions: {
    'mth-step-change': 'Cancelable event emitted before transitioning between steps.',
    'mth-complete': 'Emitted when the final step passes validation and completes.',
  },
  cssProperties: [
    { name: '--mth-color-surface', description: 'Wizard container background.' },
    { name: '--mth-color-accent', description: 'Active step and primary button accent.' },
    { name: '--mth-color-border', description: 'Divider and button border color.' },
    { name: '--mth-radius-lg', description: 'Container corner radius.' },
  ],
};
