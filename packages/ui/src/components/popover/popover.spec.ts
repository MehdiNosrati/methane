import type { ComponentBehaviorSpec } from '@methane-ui/spec-compiler';
import { popoverMessages } from './popover.messages.js';

export const popoverSpec: ComponentBehaviorSpec = {
  tag: 'mth-popover',
  package: '@methane-ui/ui',
  conformance: ['overlay'],
  controllers: ['OverlayController', 'PositioningController', 'FocusTrapController'],
  focusModel: 'none',
  states: ['open', 'modal'],
  keyboard: [
    {
      key: 'Escape',
      when: 'open and closeOnEscape is true',
      expect: 'dismisses popover and restores focus to trigger',
    },
  ],
  props: [
    { name: 'open', attr: 'open', type: 'boolean', default: false },
    { name: 'placement', attr: 'placement', type: 'string', default: 'bottom' },
    { name: 'offset', attr: 'offset', type: 'number', default: 8 },
    { name: 'modal', attr: 'modal', type: 'boolean', default: false },
    { name: 'label', attr: 'label', type: 'string', default: '' },
    { name: 'closeOnEscape', attr: 'close-on-escape', type: 'boolean', default: true },
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
    { name: '', description: 'Popover floating surface content.' },
    { name: 'trigger', description: 'Optional declarative trigger element anchoring the popover.' },
  ],
  parts: [
    { name: 'anchor', description: 'Wrapper around the slotted trigger element.' },
    { name: 'base', description: 'Positioned floating popover surface.' },
    { name: 'content', description: 'Inner content wrapper inside the popover surface.' },
    { name: 'arrow', description: 'Directional arrow indicator positioned toward the anchor.' },
  ],
  messages: { ...popoverMessages },
};

export const CEM_METADATA = {
  description:
    'Floating overlay surface with dual-path CSS Anchor Positioning and JS collision fallback via adopted CSSStyleSheet.',
  propDescriptions: {
    open: 'Controls open visibility of the popover.',
    placement: 'Preferred placement side and alignment relative to anchor.',
    offset: 'Pixel gap between anchor and popover surface.',
    modal: 'Enables modal focus trapping and disables light-dismiss when true.',
    label: 'Accessible label applied when modal dialog semantics are active.',
    closeOnEscape: 'Allows dismissing the popover via the Escape key.',
    forceFallback: 'Forces JS positioning and non-top-layer fallback mode.',
    anchor: 'Optional explicit Element, VirtualAnchor, or DOMRect positioning target.',
  },
  eventDescriptions: {
    'mth-open': 'Cancelable event fired before opening the popover.',
    'mth-after-open': 'Fired after opening completes.',
    'mth-close': 'Cancelable event fired before closing the popover.',
    'mth-after-close': 'Fired after closing completes and focus restores.',
  },
  cssProperties: [
    { name: '--mth-color-surface-raised', description: 'Popover surface background.' },
    { name: '--mth-color-border', description: 'Popover surface border color.' },
    { name: '--mth-radius-md', description: 'Popover surface corner radius.' },
    { name: '--mth-shadow-lg', description: 'Popover surface elevation shadow.' },
  ],
};
