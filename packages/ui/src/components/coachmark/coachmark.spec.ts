import type { ComponentBehaviorSpec } from '@methane/spec-compiler';
import { coachmarkMessages } from './coachmark.messages.js';

export const coachmarkSpec: ComponentBehaviorSpec = {
  tag: 'mth-coachmark',
  package: '@methane/ui',
  conformance: ['overlay'],
  controllers: ['OverlayController', 'PositioningController'],
  focusModel: 'none',
  states: ['open', 'beacon'],
  keyboard: [{ key: 'Escape', when: 'open', expect: 'Dismisses the coachmark and restores focus.' }],
  props: [
    { name: 'open', attr: 'open', type: 'boolean', default: false },
    { name: 'target', attr: 'target', type: 'string', default: '' },
    { name: 'heading', attr: 'heading', type: 'string', default: '' },
    {
      name: 'placement',
      attr: 'placement',
      type: "'top' | 'bottom' | 'left' | 'right' | 'top-start' | 'top-end' | 'bottom-start' | 'bottom-end' | 'left-start' | 'left-end' | 'right-start' | 'right-end'",
      default: 'bottom',
    },
    { name: 'beacon', attr: 'beacon', type: 'boolean', default: true },
    { name: 'closable', attr: 'closable', type: 'boolean', default: true },
    { name: 'dismissLabel', attr: 'dismiss-label', type: 'string', default: '' },
    { name: 'step', attr: 'step', type: 'number', default: 0 },
    { name: 'total', attr: 'total', type: 'number', default: 0 },
    { name: 'forceFallback', attr: 'force-fallback', type: 'boolean', default: false },
  ],
  events: [
    { name: 'mth-open', cancelable: true, detailType: 'undefined' },
    { name: 'mth-after-open', cancelable: false, detailType: 'undefined' },
    { name: 'mth-close', cancelable: true, detailType: '{ reason: string }' },
    { name: 'mth-after-close', cancelable: false, detailType: 'undefined' },
    { name: 'mth-dismiss', cancelable: false, detailType: 'undefined' },
  ],
  slots: [
    { name: '', description: 'Explanatory copy inside the coachmark popover.' },
    { name: 'actions', description: 'Optional extra action controls.' },
  ],
  parts: [
    { name: 'base', description: 'Coachmark popover container.' },
    { name: 'beacon', description: 'Optional animated attention dot.' },
    { name: 'header', description: 'Header containing title and close button.' },
    { name: 'heading', description: 'Coachmark heading.' },
    { name: 'close-button', description: 'Close icon button.' },
    { name: 'body', description: 'Coachmark descriptive body.' },
    { name: 'footer', description: 'Footer with step progress and primary dismiss CTA.' },
    { name: 'dismiss-button', description: 'Primary acknowledgement button.' },
    { name: 'arrow', description: 'Directional pointer arrow.' },
  ],
  messages: { ...coachmarkMessages },
};

export const CEM_METADATA = {
  description:
    'Anchored feature-discovery coachmark popover using `OverlayController` and `PositioningController` with optional beacon and step counter.',
  propDescriptions: {
    open: 'Controls whether the coachmark is visible.',
    target: 'CSS selector resolving the anchor element in the document.',
    heading: 'Title text rendered in the coachmark header.',
    placement: 'Preferred placement relative to the target element.',
    beacon: 'Displays an attention beacon indicator.',
    closable: 'Renders the header close icon button.',
    dismissLabel: 'Custom label for the primary dismiss button.',
    step: 'Optional 1-based step index shown in the footer.',
    total: 'Optional total number of steps shown alongside `step`.',
    forceFallback: 'Forces JavaScript positioning fallback for deterministic testing.',
  },
  eventDescriptions: {
    'mth-open': 'Cancelable event fired before opening.',
    'mth-after-open': 'Fired after opening.',
    'mth-close': 'Cancelable event fired before closing.',
    'mth-after-close': 'Fired after closing.',
    'mth-dismiss': 'Fired when dismissed via the primary acknowledgement CTA.',
  },
  cssProperties: [
    { name: '--mth-color-surface-raised', description: 'Popover background color' },
    { name: '--mth-color-accent', description: 'Beacon and primary button accent color' },
    { name: '--mth-color-accent-fg', description: 'Primary button text color' },
    { name: '--mth-color-fg', description: 'Foreground text color' },
    { name: '--mth-color-border', description: 'Border color' },
    { name: '--mth-radius-lg', description: 'Popover corner radius' },
    { name: '--mth-shadow-lg', description: 'Popover elevation shadow' },
  ],
};
