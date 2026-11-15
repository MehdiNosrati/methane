import type { ComponentBehaviorSpec } from '@methane/spec-compiler';
import { tourMessages } from './tour.messages.js';

export const tourSpec: ComponentBehaviorSpec = {
  tag: 'mth-tour',
  package: '@methane/ui',
  conformance: ['overlay'],
  controllers: ['OverlayController', 'PositioningController', 'FocusTrapController'],
  focusModel: 'none',
  states: ['open'],
  keyboard: [
    { key: 'Escape', when: 'open', expect: 'Skips/closes the active tour and restores focus.' },
    { key: 'ArrowRight', when: 'open', expect: 'Advances to the next tour step.' },
    { key: 'ArrowLeft', when: 'open', expect: 'Returns to the previous tour step.' },
  ],
  props: [
    { name: 'open', attr: 'open', type: 'boolean', default: false },
    { name: 'currentStep', attr: 'current-step', type: 'number', default: 0 },
    { name: 'label', attr: 'label', type: 'string', default: '' },
    { name: 'forceFallback', attr: 'force-fallback', type: 'boolean', default: false },
  ],
  events: [
    { name: 'mth-open', cancelable: true, detailType: 'undefined' },
    { name: 'mth-after-open', cancelable: false, detailType: 'undefined' },
    { name: 'mth-close', cancelable: true, detailType: '{ reason: string }' },
    { name: 'mth-after-close', cancelable: false, detailType: 'undefined' },
    { name: 'mth-step-change', cancelable: false, detailType: '{ index: number; stepId: string }' },
    { name: 'mth-complete', cancelable: false, detailType: 'undefined' },
    { name: 'mth-skip', cancelable: false, detailType: '{ index: number }' },
  ],
  slots: [
    { name: '', description: 'Slotted `<mth-tour-step>` elements defining each tour step.' },
  ],
  parts: [
    { name: 'base', description: 'Floating tour card surface.' },
    { name: 'header', description: 'Header with current step heading and close button.' },
    { name: 'heading', description: 'Active step heading.' },
    { name: 'close-button', description: 'Skip/close button.' },
    { name: 'body', description: 'Body rendering the active `<mth-tour-step>`.' },
    { name: 'footer', description: 'Step progress indicator and Previous/Next/Finish controls.' },
    { name: 'progress', description: 'Current step indicator.' },
    { name: 'prev-button', description: 'Previous step button.' },
    { name: 'next-button', description: 'Next or finish step button.' },
    { name: 'skip-button', description: 'Skip tour button.' },
  ],
  messages: { ...tourMessages },
};

export const CEM_METADATA = {
  description:
    'Guided multi-step onboarding tour orchestrating Light-DOM `<mth-tour-step>` children with `OverlayController`, `PositioningController`, and `FocusTrapController`.',
  propDescriptions: {
    open: 'Controls whether the guided tour overlay is visible.',
    currentStep: 'Zero-based index of the active `<mth-tour-step>`.',
    label: 'Accessible region/dialog label for the tour.',
    forceFallback: 'Forces JavaScript positioning fallback for deterministic anchoring.',
  },
  eventDescriptions: {
    'mth-open': 'Cancelable event fired before starting/opening the tour.',
    'mth-after-open': 'Fired after the tour overlay opens.',
    'mth-close': 'Cancelable event fired before closing the tour.',
    'mth-after-close': 'Fired after the tour closes.',
    'mth-step-change': 'Fired when the active tour step index changes.',
    'mth-complete': 'Fired when finishing the final tour step.',
    'mth-skip': 'Fired when skipping/dismissing before completion.',
  },
  cssProperties: [
    { name: '--mth-color-surface-raised', description: 'Tour card surface background' },
    { name: '--mth-color-fg', description: 'Tour card foreground color' },
    { name: '--mth-color-accent', description: 'Primary next/finish button background' },
    { name: '--mth-color-accent-fg', description: 'Primary button text color' },
    { name: '--mth-color-border', description: 'Tour card border color' },
    { name: '--mth-radius-lg', description: 'Tour card corner radius' },
    { name: '--mth-shadow-lg', description: 'Tour card elevation shadow' },
  ],
};
