import type { ComponentBehaviorSpec } from '@methane/spec-compiler';
import { bottomSheetMessages } from './bottom-sheet.messages.js';

export const bottomSheetSpec: ComponentBehaviorSpec = {
  tag: 'mth-bottom-sheet',
  package: '@methane/ui',
  conformance: ['overlay'],
  controllers: ['OverlayController', 'FocusTrapController', 'MotionController', 'DragSortController'],
  focusModel: 'none',
  states: ['open', 'detent-collapsed', 'detent-half', 'detent-full', 'dragging'],
  keyboard: [
    { key: 'Escape', when: 'open', expect: 'Closes the bottom sheet and restores focus to trigger.' },
    { key: 'ArrowUp', when: 'handle focused', expect: 'Expands the sheet detent.' },
    { key: 'ArrowDown', when: 'handle focused', expect: 'Collapses or dismisses the sheet.' },
  ],
  props: [
    { name: 'open', attr: 'open', type: 'boolean', default: false },
    { name: 'detent', attr: 'detent', type: "'collapsed' | 'half' | 'full'", default: 'half' },
    { name: 'closable', attr: 'closable', type: 'boolean', default: true },
    { name: 'lightDismiss', attr: 'light-dismiss', type: 'boolean', default: true },
    { name: 'closeOnEscape', attr: 'close-on-escape', type: 'boolean', default: true },
    { name: 'label', attr: 'label', type: 'string', default: '' },
  ],
  events: [
    { name: 'mth-open', cancelable: true, detailType: 'undefined' },
    { name: 'mth-after-open', cancelable: false, detailType: 'undefined' },
    { name: 'mth-close', cancelable: true, detailType: '{ reason: string }' },
    { name: 'mth-after-close', cancelable: false, detailType: 'undefined' },
    { name: 'mth-detent-change', cancelable: false, detailType: "{ detent: 'collapsed' | 'half' | 'full' }" },
  ],
  slots: [
    { name: '', description: 'Main body content inside the bottom sheet.' },
    { name: 'header', description: 'Optional header content beside the drag handle.' },
    { name: 'footer', description: 'Optional sticky footer actions.' },
  ],
  parts: [
    { name: 'base', description: 'Native `<dialog>` modal sheet surface.' },
    { name: 'handle-bar', description: 'Interactive drag handle region at the top of the sheet.' },
    { name: 'handle', description: 'Visual grab indicator inside the handle bar.' },
    { name: 'header', description: 'Sheet header container.' },
    { name: 'title', description: 'Accessible sheet heading.' },
    { name: 'close-button', description: 'Dismiss button in the header.' },
    { name: 'body', description: 'Scrollable sheet body.' },
    { name: 'footer', description: 'Sheet footer container.' },
  ],
  messages: { ...bottomSheetMessages },
};

export const CEM_METADATA = {
  description:
    'Mobile-friendly modal bottom sheet backed by `<dialog>`, `OverlayController`, `FocusTrapController`, `MotionController`, and detent snapping.',
  propDescriptions: {
    open: 'Controls whether the bottom sheet is open.',
    detent: 'Current vertical snap height (`collapsed`, `half`, or `full`).',
    closable: 'Renders a close button in the sheet header.',
    lightDismiss: 'Allows closing the sheet by clicking the backdrop.',
    closeOnEscape: 'Allows closing the sheet when pressing Escape.',
    label: 'Accessible title announced for the sheet dialog.',
  },
  eventDescriptions: {
    'mth-open': 'Cancelable event fired before opening the sheet.',
    'mth-after-open': 'Fired after the sheet finishes opening.',
    'mth-close': 'Cancelable event fired before closing the sheet.',
    'mth-after-close': 'Fired after the sheet closes.',
    'mth-detent-change': 'Fired when the active detent changes.',
  },
  cssProperties: [
    { name: '--mth-color-surface-raised', description: 'Sheet background surface color' },
    { name: '--mth-color-fg', description: 'Sheet foreground text color' },
    { name: '--mth-color-border', description: 'Divider and border color' },
    { name: '--mth-color-backdrop', description: 'Backdrop color behind the modal sheet' },
    { name: '--mth-radius-xl', description: 'Top corner radius of the sheet' },
    { name: '--mth-shadow-lg', description: 'Elevation shadow of the sheet surface' },
  ],
};
