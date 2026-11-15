import type { ComponentBehaviorSpec } from '@methane-ui/spec-compiler';
import { tourStepMessages } from './tour-step.messages.js';

export const tourStepSpec: ComponentBehaviorSpec = {
  tag: 'mth-tour-step',
  package: '@methane-ui/ui',
  conformance: [],
  controllers: [],
  focusModel: 'none',
  states: ['active'],
  keyboard: [],
  props: [
    { name: 'stepId', attr: 'step-id', type: 'string', default: '' },
    { name: 'target', attr: 'target', type: 'string', default: '' },
    { name: 'heading', attr: 'heading', type: 'string', default: '' },
    {
      name: 'placement',
      attr: 'placement',
      type: "'top' | 'bottom' | 'left' | 'right' | 'top-start' | 'top-end' | 'bottom-start' | 'bottom-end' | 'left-start' | 'left-end' | 'right-start' | 'right-end'",
      default: 'bottom',
    },
    { name: 'active', attr: 'active', type: 'boolean', default: false },
  ],
  events: [{ name: 'mth-step-enter', cancelable: false, detailType: '{ stepId: string }' }],
  slots: [
    { name: '', description: 'Descriptive step body rendered when the step is active.' },
    { name: 'media', description: 'Optional illustration or media slot for the tour step.' },
  ],
  parts: [
    { name: 'base', description: 'Step content container.' },
    { name: 'heading', description: 'Optional step heading when rendered standalone.' },
    { name: 'body', description: 'Slotted step content.' },
  ],
  messages: { ...tourStepMessages },
};

export const CEM_METADATA = {
  description:
    'Declarative guided-tour step item consumed by `<mth-tour>` or displayed standalone, pairing a target CSS selector with heading, placement, and slotted instructions.',
  propDescriptions: {
    stepId: 'Stable identifier for the step.',
    target: 'CSS selector of the DOM element anchored by this tour step.',
    heading: 'Heading displayed in the tour popover for this step.',
    placement: 'Preferred popover placement relative to the target element.',
    active: 'Marks whether this step is currently active.',
  },
  eventDescriptions: {
    'mth-step-enter': 'Fired when this step becomes active.',
  },
  cssProperties: [
    { name: '--mth-color-fg', description: 'Step foreground text color' },
    { name: '--mth-font-size-md', description: 'Step heading font size' },
  ],
};
