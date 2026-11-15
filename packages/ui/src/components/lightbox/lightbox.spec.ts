import type { ComponentBehaviorSpec } from '@methane/spec-compiler';
import { lightboxMessages } from './lightbox.messages.js';

export const lightboxSpec: ComponentBehaviorSpec = {
  tag: 'mth-lightbox',
  package: '@methane/ui',
  conformance: ['overlay'],
  controllers: ['OverlayController', 'FocusTrapController'],
  focusModel: 'none',
  states: ['open', 'zoomed'],
  keyboard: [
    { key: 'Escape', when: 'open', expect: 'Closes the lightbox and restores focus to trigger.' },
    { key: 'ArrowRight', when: 'open', expect: 'Moves to the next lightbox item.' },
    { key: 'ArrowLeft', when: 'open', expect: 'Moves to the previous lightbox item.' },
  ],
  props: [
    { name: 'open', attr: 'open', type: 'boolean', default: false },
    { name: 'index', attr: 'index', type: 'number', default: 0 },
    { name: 'loop', attr: 'loop', type: 'boolean', default: true },
    { name: 'closable', attr: 'closable', type: 'boolean', default: true },
    { name: 'zoomable', attr: 'zoomable', type: 'boolean', default: true },
    { name: 'label', attr: 'label', type: 'string', default: '' },
    { name: 'items', attr: false, type: 'ReadonlyArray<MthLightboxItem>' },
  ],
  events: [
    { name: 'mth-open', cancelable: true, detailType: 'undefined' },
    { name: 'mth-after-open', cancelable: false, detailType: 'undefined' },
    { name: 'mth-close', cancelable: true, detailType: '{ reason: string }' },
    { name: 'mth-after-close', cancelable: false, detailType: 'undefined' },
    { name: 'mth-change', cancelable: false, detailType: '{ index: number; item: MthLightboxItem | null }' },
  ],
  slots: [
    { name: '', description: 'Fallback content when no `items` array is supplied.' },
    { name: 'caption', description: 'Optional custom caption content.' },
    { name: 'actions', description: 'Optional toolbar actions beside close and zoom controls.' },
  ],
  parts: [
    { name: 'base', description: 'Native `<dialog>` modal surface.' },
    { name: 'toolbar', description: 'Top control bar containing counter, zoom, and close controls.' },
    { name: 'stage', description: 'Media viewport stage containing image and navigation buttons.' },
    { name: 'image', description: 'Rendered lightbox `<img>` element.' },
    { name: 'prev-button', description: 'Previous item button.' },
    { name: 'next-button', description: 'Next item button.' },
    { name: 'zoom-button', description: 'Zoom toggle button.' },
    { name: 'close-button', description: 'Dismiss button.' },
    { name: 'caption', description: 'Caption region below the media stage.' },
  ],
  messages: { ...lightboxMessages },
};

export const CEM_METADATA = {
  description:
    'Modal media lightbox wrapping `<dialog>` with `OverlayController`, `FocusTrapController`, sanitized image URLs, zoom toggle, and keyboard gallery navigation.',
  propDescriptions: {
    open: 'Controls whether the lightbox modal is open.',
    index: 'Zero-based index of the currently active media item.',
    loop: 'Wraps navigation from last item to first and vice versa.',
    closable: 'Renders the close button inside the toolbar.',
    zoomable: 'Allows toggling zoomed image presentation.',
    label: 'Accessible dialog title announced to assistive technologies.',
    items: 'Array of media entries `{ src, alt?, caption?, title? }`.',
  },
  eventDescriptions: {
    'mth-open': 'Cancelable event fired before opening the lightbox.',
    'mth-after-open': 'Fired after the lightbox finishes opening.',
    'mth-close': 'Cancelable event fired before closing the lightbox.',
    'mth-after-close': 'Fired after the lightbox closes.',
    'mth-change': 'Fired when the active item index changes.',
  },
  cssProperties: [
    { name: '--mth-color-backdrop', description: 'Modal backdrop tint.' },
    { name: '--mth-color-surface', description: 'Toolbar and caption surface background.' },
    { name: '--mth-color-fg', description: 'Text and control icon color.' },
    { name: '--mth-radius-lg', description: 'Media frame corner radius.' },
    { name: '--mth-z-index-modal', description: 'Fallback modal stacking z-index.' },
  ],
};
