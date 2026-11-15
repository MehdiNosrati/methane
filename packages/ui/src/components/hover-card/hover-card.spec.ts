import type { ComponentBehaviorSpec } from '@methane-ui/spec-compiler';
import { hoverCardMessages } from './hover-card.messages.js';

export const hoverCardSpec: ComponentBehaviorSpec = {
  tag: 'mth-hover-card',
  package: '@methane-ui/ui',
  conformance: ['overlay'],
  controllers: ['OverlayController', 'PositioningController'],
  focusModel: 'none',
  states: ['open'],
  keyboard: [{ key: 'Escape', when: 'open', expect: 'Closes the open hover card and restores focus to trigger.' }],
  props: [
    { name: 'open', attr: 'open', type: 'boolean', default: false },
    {
      name: 'placement',
      attr: 'placement',
      type: "'top' | 'bottom' | 'left' | 'right' | 'top-start' | 'top-end' | 'bottom-start' | 'bottom-end' | 'left-start' | 'left-end' | 'right-start' | 'right-end'",
      default: 'bottom',
    },
    { name: 'openDelay', attr: 'open-delay', type: 'number', default: 200 },
    { name: 'closeDelay', attr: 'close-delay', type: 'number', default: 300 },
    { name: 'disabled', attr: 'disabled', type: 'boolean', default: false },
    { name: 'forceFallback', attr: 'force-fallback', type: 'boolean', default: false },
    { name: 'label', attr: 'label', type: 'string', default: '' },
  ],
  events: [
    { name: 'mth-open', cancelable: true, detailType: 'undefined' },
    { name: 'mth-after-open', cancelable: false, detailType: 'undefined' },
    { name: 'mth-close', cancelable: true, detailType: 'undefined' },
    { name: 'mth-after-close', cancelable: false, detailType: 'undefined' },
  ],
  slots: [
    { name: '', description: 'Rich preview content rendered inside the floating hover card.' },
    { name: 'trigger', description: 'Interactive trigger element activating the hover card.' },
  ],
  parts: [
    { name: 'trigger', description: 'Wrapper around the slotted trigger element.' },
    { name: 'popup', description: 'Floating hover card surface container.' },
    { name: 'arrow', description: 'Optional directional arrow indicator.' },
    { name: 'content', description: 'Inner body container inside the hover card popup.' },
  ],
  messages: { ...hoverCardMessages },
};

export const CEM_METADATA = {
  description:
    'Rich preview card anchored to a trigger with progressive `interestfor` enhancement, hover/focus timers, and dual-path CSS Anchor / JS positioning.',
  propDescriptions: {
    open: 'Whether the hover card popup is open.',
    placement: 'Preferred floating placement relative to the trigger.',
    openDelay: 'Delay in milliseconds before opening on hover or focus.',
    closeDelay: 'Delay in milliseconds before closing after pointer or focus leaves.',
    disabled: 'Prevents the hover card from opening interactively.',
    forceFallback: 'Forces JavaScript fallback positioning instead of CSS Anchor Positioning.',
    label: 'Accessible label applied to the floating hover card dialog surface.',
  },
  eventDescriptions: {
    'mth-open': 'Cancelable event dispatched before the hover card opens.',
    'mth-after-open': 'Dispatched after the hover card opens.',
    'mth-close': 'Cancelable event dispatched before the hover card closes.',
    'mth-after-close': 'Dispatched after the hover card closes.',
  },
  cssProperties: [
    { name: '--mth-color-surface-raised', description: 'Popup surface background color.' },
    { name: '--mth-color-fg', description: 'Popup text color.' },
    { name: '--mth-color-border', description: 'Popup border color.' },
    { name: '--mth-radius-lg', description: 'Popup corner radius.' },
    { name: '--mth-shadow-lg', description: 'Popup elevation shadow.' },
    { name: '--mth-z-index-popover', description: 'Fallback popup z-index layer.' },
  ],
};
