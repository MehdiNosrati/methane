import type { ComponentBehaviorSpec } from '@methane-ui/spec-compiler';
import { progressBarMessages } from './progress-bar.messages.js';

export const progressBarSpec: ComponentBehaviorSpec = {
  tag: 'mth-progress-bar',
  package: '@methane-ui/ui',
  conformance: [],
  controllers: [],
  focusModel: 'none',
  states: ['indeterminate'],
  keyboard: [],
  props: [
    { name: 'value', attr: 'value', type: 'number', default: 0 },
    { name: 'max', attr: 'max', type: 'number', default: 100 },
    { name: 'indeterminate', attr: 'indeterminate', type: 'boolean', default: false },
    { name: 'label', attr: 'label', type: 'string', default: '' },
  ],
  events: [],
  slots: [
    { name: 'label', description: 'Optional visible label content overriding `label` text.' },
  ],
  parts: [
    { name: 'base', description: 'Root progress bar wrapper.' },
    { name: 'label', description: 'Optional visible progress label container.' },
    { name: 'track', description: 'Semantic `role="progressbar"` track element.' },
    { name: 'fill', description: 'Filled progress indicator driven by `--_progress`.' },
  ],
  messages: { ...progressBarMessages },
};

export const CEM_METADATA = {
  description:
    'Accessible determinate and indeterminate progress bar driven by adopted CSSStyleSheet `--_progress` custom property.',
  propDescriptions: {
    value: 'Current numeric progress value clamped between `0` and `max`.',
    max: 'Maximum progress value (defaults to `100`).',
    indeterminate: 'Switches to indeterminate mode and omits `aria-valuenow`.',
    label: 'Accessible label for the progressbar; defaults to localized `"Progress"` when empty.',
  },
  cssProperties: [
    { name: '--mth-color-bg-subtle', description: 'Progress track background color.' },
    { name: '--mth-color-accent', description: 'Progress fill bar color.' },
    { name: '--mth-radius-full', description: 'Progress track corner radius.' },
  ],
};
