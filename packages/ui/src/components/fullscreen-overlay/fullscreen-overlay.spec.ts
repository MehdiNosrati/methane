import type { ComponentBehaviorSpec } from '@methane-ui/spec-compiler';
import { fullscreenOverlayMessages } from './fullscreen-overlay.messages.js';

export const fullscreenOverlaySpec: ComponentBehaviorSpec = {
  tag: 'mth-fullscreen-overlay',
  package: '@methane-ui/ui',
  conformance: ['overlay'],
  controllers: ['OverlayController', 'FocusTrapController', 'MotionController'],
  focusModel: 'none',
  states: ['open'],
  keyboard: [{ key: 'Escape', when: 'open', expect: 'Closes the fullscreen overlay and restores focus to the trigger.' }],
  props: [
    { name: 'open', attr: 'open', type: 'boolean', default: false },
    { name: 'label', attr: 'label', type: 'string', default: '' },
    { name: 'closable', attr: 'closable', type: 'boolean', default: true },
    { name: 'closeOnEscape', attr: 'close-on-escape', type: 'boolean', default: true },
  ],
  events: [
    { name: 'mth-open', cancelable: true, detailType: 'undefined' },
    { name: 'mth-after-open', cancelable: false, detailType: 'undefined' },
    { name: 'mth-close', cancelable: true, detailType: '{ reason: string }' },
    { name: 'mth-after-close', cancelable: false, detailType: 'undefined' },
  ],
  slots: [
    { name: '', description: 'Main body content inside the fullscreen overlay.' },
    { name: 'header', description: 'Optional custom header title content.' },
    { name: 'actions', description: 'Optional header actions beside the close button.' },
    { name: 'footer', description: 'Optional sticky footer actions.' },
  ],
  parts: [
    { name: 'base', description: 'Native `<dialog>` modal viewport surface.' },
    { name: 'header', description: 'Top header bar.' },
    { name: 'title', description: 'Accessible overlay heading.' },
    { name: 'actions', description: 'Header action controls wrapper.' },
    { name: 'close-button', description: 'Dismiss button.' },
    { name: 'body', description: 'Scrollable main overlay viewport.' },
    { name: 'footer', description: 'Bottom footer container.' },
  ],
  messages: { ...fullscreenOverlayMessages },
};

export const CEM_METADATA = {
  description:
    'Edge-to-edge modal `<dialog>` overlay built with `OverlayController`, `FocusTrapController`, and `MotionController`.',
  propDescriptions: {
    open: 'Controls whether the fullscreen overlay is open.',
    label: 'Accessible heading and dialog label.',
    closable: 'Renders the close button in the top header.',
    closeOnEscape: 'Allows dismissing the overlay with Escape.',
  },
  eventDescriptions: {
    'mth-open': 'Cancelable event fired before opening the overlay.',
    'mth-after-open': 'Fired after the overlay finishes opening.',
    'mth-close': 'Cancelable event fired before closing the overlay.',
    'mth-after-close': 'Fired after the overlay closes.',
  },
  cssProperties: [
    { name: '--mth-color-bg', description: 'Fullscreen viewport background color' },
    { name: '--mth-color-fg', description: 'Overlay foreground text color' },
    { name: '--mth-color-border', description: 'Header and footer divider border color' },
    { name: '--mth-motion-duration-normal', description: 'Enter/exit transition duration' },
  ],
};
