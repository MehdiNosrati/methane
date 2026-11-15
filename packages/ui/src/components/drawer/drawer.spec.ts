import type { ComponentBehaviorSpec } from '@methane/spec-compiler';
import { drawerMessages } from './drawer.messages.js';

export const drawerSpec: ComponentBehaviorSpec = {
  tag: 'mth-drawer',
  package: '@methane/ui',
  conformance: ['overlay'],
  controllers: ['OverlayController', 'FocusTrapController', 'MotionController'],
  focusModel: 'host',
  states: ['open', 'modal'],
  keyboard: [
    {
      key: 'Escape',
      when: 'open and dismissible is true',
      expect: 'emits mth-cancel, dismisses drawer, and restores focus',
    },
  ],
  props: [
    { name: 'open', attr: 'open', type: 'boolean', default: false },
    {
      name: 'placement',
      attr: 'placement',
      type: "'end' | 'start' | 'top' | 'bottom'",
      default: 'end',
    },
    {
      name: 'size',
      attr: 'size',
      type: "'sm' | 'md' | 'lg' | 'full'",
      default: 'md',
    },
    { name: 'label', attr: 'label', type: 'string', default: '' },
    { name: 'dismissible', attr: 'dismissible', type: 'boolean', default: true },
    { name: 'modal', attr: 'modal', type: 'boolean', default: true },
    { name: 'forceFallback', attr: 'force-fallback', type: 'boolean', default: false },
  ],
  events: [
    { name: 'mth-open', cancelable: true, detailType: 'void' },
    { name: 'mth-after-open', cancelable: false, detailType: 'void' },
    { name: 'mth-close', cancelable: true, detailType: '{ reason: string }' },
    { name: 'mth-after-close', cancelable: false, detailType: '{ reason: string }' },
    { name: 'mth-cancel', cancelable: true, detailType: '{ reason: string }' },
  ],
  slots: [
    { name: '', description: 'Main drawer body content.' },
    { name: 'header', description: 'Optional custom header replacing default title text.' },
    { name: 'footer', description: 'Optional drawer footer action bar.' },
  ],
  parts: [
    { name: 'base', description: 'Native internal `<dialog>` overlay container.' },
    { name: 'popup', description: 'Sliding drawer sheet panel surface.' },
    { name: 'header', description: 'Drawer header row.' },
    { name: 'title', description: 'Drawer heading element.' },
    { name: 'close-button', description: 'Dismiss button rendered when dismissible.' },
    { name: 'body', description: 'Scrollable drawer body region.' },
    { name: 'footer', description: 'Drawer footer container.' },
  ],
  messages: { ...drawerMessages },
};

export const CEM_METADATA = {
  description:
    'Top-layer sliding sheet overlay wrapping native `<dialog>` with logical edge placements, focus trapping, and exit/enter transitions.',
  propDescriptions: {
    open: 'Controls open visibility of the drawer.',
    placement: 'Logical edge from which the drawer slides (`end | start | top | bottom`).',
    size: 'Drawer dimension preset (`sm | md | lg | full`).',
    label: 'Accessible drawer title rendered in the header.',
    dismissible: 'Allows dismissing via Escape key, backdrop click, and close button.',
    modal: 'Opens in top-layer modal mode with backdrop and focus trap when true.',
    forceFallback: 'Forces non-top-layer fallback positioning even when native top-layer is supported.',
  },
  eventDescriptions: {
    'mth-open': 'Cancelable event fired before opening the drawer.',
    'mth-after-open': 'Fired once the entry transition completes.',
    'mth-close': 'Cancelable event fired before closing the drawer.',
    'mth-after-close': 'Fired once exit transition completes and focus restores.',
    'mth-cancel': 'Cancelable event fired when dismissed via Escape or backdrop click.',
  },
  cssProperties: [
    { name: '--mth-color-surface-raised', description: 'Drawer panel background.' },
    { name: '--mth-color-backdrop', description: 'Backdrop scrim color behind modal drawers.' },
    { name: '--mth-drawer-size', description: 'Override dimension for the drawer sheet.' },
    { name: '--mth-shadow-lg', description: 'Drawer panel elevation shadow.' },
  ],
};
