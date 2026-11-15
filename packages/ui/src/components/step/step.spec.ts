import type { ComponentBehaviorSpec } from '@methane-ui/spec-compiler';
import { stepMessages } from './step.messages.js';

export type StepStatus = 'upcoming' | 'current' | 'complete' | 'error';

export const stepSpec: ComponentBehaviorSpec = {
  tag: 'mth-step',
  package: '@methane-ui/ui',
  conformance: [],
  controllers: [],
  focusModel: 'none',
  states: ['complete', 'current', 'error', 'disabled'],
  keyboard: [],
  props: [
    { name: 'value', attr: 'value', type: 'string', default: '' },
    { name: 'label', attr: 'label', type: 'string', default: '' },
    { name: 'description', attr: 'description', type: 'string', default: '' },
    { name: 'status', attr: 'status', type: "'upcoming' | 'current' | 'complete' | 'error'", default: 'upcoming' },
    { name: 'stepNumber', attr: 'step-number', type: 'number', default: 0 },
    { name: 'disabled', attr: 'disabled', type: 'boolean', default: false },
  ],
  events: [],
  slots: [{ name: '', description: 'Step panel or detail content.' }],
  parts: [
    { name: 'base', description: 'Step container.' },
    { name: 'indicator', description: 'Numeric or status badge.' },
    { name: 'body', description: 'Label, description, and slot wrapper.' },
    { name: 'label', description: 'Step heading label.' },
    { name: 'description', description: 'Optional step secondary description.' },
    { name: 'content', description: 'Step slotted body content.' },
  ],
  messages: { ...stepMessages },
};

export const CEM_METADATA = {
  description: 'Declarative step item used standalone or composed inside `<mth-stepper>`.',
  propDescriptions: {
    value: 'Unique step identifier.',
    label: 'Step title displayed in the stepper header.',
    description: 'Optional concise helper description.',
    status: 'Visual/semantic step status (`upcoming`, `current`, `complete`, or `error`).',
    stepNumber: '1-based display number shown in the step indicator.',
    disabled: 'Prevents activating this step.',
  },
  eventDescriptions: {},
  cssProperties: [
    { name: '--mth-color-surface', description: 'Indicator default background.' },
    { name: '--mth-color-fg', description: 'Primary step text color.' },
    { name: '--mth-color-fg-muted', description: 'Description text color.' },
    { name: '--mth-color-border', description: 'Indicator border color.' },
    { name: '--mth-color-accent', description: 'Current step indicator highlight.' },
    { name: '--mth-color-success', description: 'Completed step indicator color.' },
    { name: '--mth-color-danger', description: 'Error step indicator color.' },
    { name: '--mth-font-size-md', description: 'Step label font size.' },
    { name: '--mth-font-size-sm', description: 'Step description font size.' },
  ],
};
