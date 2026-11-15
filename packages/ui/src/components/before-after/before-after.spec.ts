import type { ComponentBehaviorSpec } from '@methane/spec-compiler';
import { beforeAfterMessages } from './before-after.messages.js';

export const beforeAfterSpec: ComponentBehaviorSpec = {
  tag: 'mth-before-after',
  package: '@methane/ui',
  conformance: [],
  controllers: ['DragSortController'],
  focusModel: 'delegates-focus',
  states: ['dragging', 'disabled'],
  keyboard: [
    { key: 'ArrowLeft / ArrowRight', when: 'comparison slider focused', expect: 'adjusts split position by step (RTL-aware)' },
    { key: 'PageUp / PageDown', when: 'comparison slider focused', expect: 'adjusts split position by large step (10%)' },
    { key: 'Home / End', when: 'comparison slider focused', expect: 'jumps split position to 0% or 100%' },
  ],
  props: [
    { name: 'position', attr: 'position', type: 'number', default: 50 },
    { name: 'step', attr: 'step', type: 'number', default: 2 },
    { name: 'label', attr: 'label', type: 'string', default: '' },
    { name: 'beforeLabel', attr: 'before-label', type: 'string', default: '' },
    { name: 'afterLabel', attr: 'after-label', type: 'string', default: '' },
    { name: 'disabled', attr: 'disabled', type: 'boolean', default: false },
  ],
  events: [{ name: 'mth-change', cancelable: false, detailType: '{ position: number }' }],
  slots: [
    { name: 'before', description: 'Content or image shown on the before side.' },
    { name: 'after', description: 'Content or image shown on the after side.' },
  ],
  parts: [
    { name: 'base', description: 'Outer comparison stage container.' },
    { name: 'after', description: 'Full-width after layer.' },
    { name: 'before', description: 'Clipped before overlay layer.' },
    { name: 'divider', description: 'Interactive split divider track.' },
    { name: 'handle', description: 'Focusable comparison slider handle.' },
  ],
  messages: { ...beforeAfterMessages },
};

export const CEM_METADATA = {
  description: 'Accessible before/after comparison slider supporting pointer dragging, RTL-aware keyboard scrubbing, and CSP-safe adopted CSSStyleSheet clipping.',
  propDescriptions: {
    position: 'Split divider percentage from 0 to 100.',
    step: 'Keyboard arrow increment percentage.',
    label: 'Accessible region and slider label.',
    beforeLabel: 'Label for the before layer.',
    afterLabel: 'Label for the after layer.',
    disabled: 'Disables pointer and keyboard adjustment.',
  },
  eventDescriptions: {
    'mth-change': 'Fired when the comparison split position changes.',
  },
  cssProperties: [
    { name: '--mth-before-after-aspect-ratio', description: 'Aspect ratio of the comparison stage.' },
  ],
};
