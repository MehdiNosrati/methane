import type { ComponentBehaviorSpec } from '@methane/spec-compiler';
import { stepperMessages } from './stepper.messages.js';

export type StepperOrientation = 'horizontal' | 'vertical';
export type StepperStatus = 'upcoming' | 'current' | 'complete' | 'error';

export interface StepperStepItem {
  readonly value: string;
  readonly label: string;
  readonly description?: string;
  readonly status?: StepperStatus;
  readonly disabled?: boolean;
}

export const EMPTY_STEPPER_STEPS: ReadonlyArray<StepperStepItem> = Object.freeze([]);

export const stepperSpec: ComponentBehaviorSpec = {
  tag: 'mth-stepper',
  package: '@methane/ui',
  conformance: ['roving-focus'],
  controllers: ['RovingFocusController', 'SlotCollectionController'],
  focusModel: 'delegates-focus',
  states: ['linear'],
  keyboard: [
    { key: 'ArrowRight', dir: 'ltr', when: 'horizontal step focused', expect: 'moves focus to next enabled step' },
    { key: 'ArrowLeft', dir: 'rtl', when: 'horizontal step focused', expect: 'moves focus to next enabled step' },
    { key: 'ArrowDown', when: 'vertical step focused', expect: 'moves focus to next enabled step' },
    { key: 'Home', when: 'step focused', expect: 'moves focus to first enabled step' },
    { key: 'End', when: 'step focused', expect: 'moves focus to last enabled step' },
    { key: 'Enter', when: 'step focused', expect: 'activates step if permitted by linear mode' },
  ],
  props: [
    { name: 'label', attr: 'label', type: 'string', default: '' },
    { name: 'orientation', attr: 'orientation', type: "'horizontal' | 'vertical'", default: 'horizontal' },
    { name: 'linear', attr: 'linear', type: 'boolean', default: false },
    { name: 'activeStep', attr: 'active-step', type: 'number', default: 0 },
    { name: 'value', attr: 'value', type: 'string', default: '' },
    {
      name: 'steps',
      attr: false,
      type: 'ReadonlyArray<StepperStepItem>',
      default: EMPTY_STEPPER_STEPS,
    },
  ],
  events: [
    {
      name: 'mth-change',
      cancelable: false,
      detailType: '{ index: number; value: string }',
    },
  ],
  slots: [
    { name: '', description: 'Optional declarative `<mth-step>` children.' },
  ],
  parts: [
    { name: 'nav', description: 'Outer `<nav>` landmark.' },
    { name: 'list', description: 'Ordered `<ol>` step list container.' },
    { name: 'item', description: 'Individual `<li>` step row.' },
    { name: 'trigger', description: 'Interactive `<button>` step header.' },
    { name: 'indicator', description: 'Step number or status badge.' },
    { name: 'label', description: 'Step heading label.' },
    { name: 'description', description: 'Optional step description.' },
    { name: 'connector', description: 'Visual connector between steps.' },
  ],
  messages: { ...stepperMessages },
};

export const CEM_METADATA = {
  description:
    'Multi-step progress and wizard navigation supporting horizontal/vertical orientation, linear step enforcement, declarative `<mth-step>` children or `.steps` array, and roving focus.',
  propDescriptions: {
    label: 'Accessible label for the stepper `<nav>` landmark.',
    orientation: 'Layout and arrow navigation axis (`horizontal` or `vertical`).',
    linear: 'Prevents jumping forward past upcoming steps until prior steps are complete.',
    activeStep: '0-based index of the currently active step.',
    value: 'Value string of the currently active step.',
    steps: 'Programmatic step definitions used when no `<mth-step>` children are slotted.',
  },
  eventDescriptions: {
    'mth-change': 'Fired when a permitted step is activated.',
  },
  cssProperties: [
    { name: '--mth-color-surface', description: 'Step badge default background.' },
    { name: '--mth-color-fg', description: 'Primary step label foreground.' },
    { name: '--mth-color-fg-muted', description: 'Description and connector color.' },
    { name: '--mth-color-border', description: 'Step connector and circle border color.' },
    { name: '--mth-color-accent', description: 'Current step highlight color.' },
    { name: '--mth-color-success', description: 'Completed step highlight color.' },
    { name: '--mth-color-danger', description: 'Error step highlight color.' },
    { name: '--mth-radius-md', description: 'Step trigger focus corner radius.' },
    { name: '--mth-font-size-md', description: 'Step label font size.' },
    { name: '--mth-font-size-sm', description: 'Step description and badge font size.' },
  ],
};
