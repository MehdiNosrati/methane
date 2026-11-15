import type { ComponentBehaviorSpec } from '@methane-ui/spec-compiler';
import { progressRingMessages } from './progress-ring.messages.js';

export const progressRingSpec: ComponentBehaviorSpec = {
  tag: 'mth-progress-ring',
  package: '@methane-ui/ui',
  conformance: [],
  controllers: [],
  focusModel: 'none',
  states: ['indeterminate', 'complete'],
  keyboard: [],
  props: [
    { name: 'value', attr: 'value', type: 'number', default: 0 },
    { name: 'max', attr: 'max', type: 'number', default: 100 },
    { name: 'indeterminate', attr: 'indeterminate', type: 'boolean', default: false },
    { name: 'size', attr: 'size', type: 'number', default: 48 },
    { name: 'strokeWidth', attr: 'stroke-width', type: 'number', default: 4 },
    { name: 'showValue', attr: 'show-value', type: 'boolean', default: false },
    { name: 'label', attr: 'label', type: 'string', default: '' },
  ],
  events: [{ name: 'mth-complete', cancelable: false, detailType: '{ value: number }' }],
  slots: [{ name: '', description: 'Optional center label overriding numeric percentage.' }],
  parts: [
    { name: 'base', description: 'Outer progressbar wrapper.' },
    { name: 'svg', description: 'SVG circular track and indicator.' },
    { name: 'track', description: 'Background ring stroke.' },
    { name: 'indicator', description: 'Active progress arc stroke.' },
    { name: 'label', description: 'Centered numeric or slotted value readout.' },
  ],
  messages: { ...progressRingMessages },
};

export const CEM_METADATA = {
  description:
    'Circular SVG progress ring with determinate percentage progress, indeterminate spinner state, CSP-safe adopted stylesheet sizing, and `progressbar` ARIA semantics.',
  propDescriptions: {
    value: 'Current progress value between 0 and `max`.',
    max: 'Maximum progress value (must be > 0).',
    indeterminate: 'Displays continuous indeterminate spinner animation.',
    size: 'Diameter of the ring in pixels.',
    strokeWidth: 'SVG stroke thickness in viewBox units.',
    showValue: 'Displays percentage text inside the center of the ring.',
    label: 'Accessible label for the progressbar.',
  },
  eventDescriptions: {
    'mth-complete': 'Fired when determinate progress reaches `max`.',
  },
  cssProperties: [
    { name: '--mth-color-border', description: 'Track stroke color' },
    { name: '--mth-color-accent', description: 'Active indicator stroke color' },
    { name: '--mth-color-fg', description: 'Center label text color' },
  ],
};
