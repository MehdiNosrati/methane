import type { ComponentBehaviorSpec } from '@methane/spec-compiler';
import { tooltipMessages } from './tooltip.messages.js';

export const tooltipSpec: ComponentBehaviorSpec = {
  tag: 'mth-tooltip',
  package: '@methane/ui',
  conformance: ['overlay'],
  controllers: ['OverlayController', 'PositioningController'],
  focusModel: 'none',
  states: ['open', 'disabled'],
  keyboard: [
    {
      key: 'Escape',
      when: 'open',
      expect: 'dismisses tooltip without moving focus',
    },
  ],
  props: [
    { name: 'open', attr: 'open', type: 'boolean', default: false },
    { name: 'content', attr: 'content', type: 'string', default: '' },
    { name: 'placement', attr: 'placement', type: 'string', default: 'top' },
    { name: 'delay', attr: 'delay', type: 'number', default: 250 },
    { name: 'offset', attr: 'offset', type: 'number', default: 8 },
    { name: 'disabled', attr: 'disabled', type: 'boolean', default: false },
    { name: 'forceFallback', attr: 'force-fallback', type: 'boolean', default: false },
    {
      name: 'anchor',
      attr: false,
      type: 'Element | { getBoundingClientRect(): DOMRect } | DOMRect | null',
      default: null,
    },
  ],
  events: [
    { name: 'mth-open', cancelable: true, detailType: 'void' },
    { name: 'mth-after-open', cancelable: false, detailType: 'void' },
    { name: 'mth-close', cancelable: true, detailType: '{ reason: string }' },
    { name: 'mth-after-close', cancelable: false, detailType: '{ reason: string }' },
  ],
  slots: [
    { name: '', description: 'Trigger element wrapped by the tooltip.' },
    { name: 'content', description: 'Optional rich tooltip content overriding `content` prop.' },
  ],
  parts: [
    { name: 'trigger', description: 'Same-root wrapper attaching `aria-describedby` and intent listeners.' },
    { name: 'base', description: 'Positioned `role="tooltip"` surface.' },
    { name: 'content', description: 'Tooltip text/content container.' },
    { name: 'arrow', description: 'Directional arrow indicator.' },
  ],
  messages: { ...tooltipMessages },
};

export const CEM_METADATA = {
  description:
    'Non-focus-stealing tooltip with progressive `interestfor` detection, hover/focus/long-press intent fallback, and adopted `CSSStyleSheet` positioning.',
  propDescriptions: {
    open: 'Controls open visibility of the tooltip.',
    content: 'Plain-text tooltip message when `slot="content"` is not provided.',
    placement: 'Preferred placement relative to the trigger.',
    delay: 'Intent show delay in milliseconds.',
    offset: 'Pixel distance between trigger and tooltip surface.',
    disabled: 'Prevents the tooltip from opening on user intent.',
    forceFallback: 'Forces JS positioning and non-top-layer fallback mode.',
    anchor: 'Optional explicit Element, VirtualAnchor, or DOMRect anchor target.',
  },
  eventDescriptions: {
    'mth-open': 'Cancelable event fired before showing the tooltip.',
    'mth-after-open': 'Fired once tooltip becomes visible.',
    'mth-close': 'Cancelable event fired before hiding the tooltip.',
    'mth-after-close': 'Fired once tooltip is hidden.',
  },
  cssProperties: [
    { name: '--mth-color-surface-inverse', description: 'Tooltip surface background.' },
    { name: '--mth-color-fg-inverse', description: 'Tooltip text color.' },
    { name: '--mth-radius-sm', description: 'Tooltip corner radius.' },
    { name: '--mth-shadow-md', description: 'Tooltip elevation shadow.' },
  ],
};
