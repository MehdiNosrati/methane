import type { ComponentBehaviorSpec } from '@methane-ui/spec-compiler';
import { galleryMessages } from './gallery.messages.js';

export const gallerySpec: ComponentBehaviorSpec = {
  tag: 'mth-gallery',
  package: '@methane-ui/ui',
  conformance: ['roving-focus'],
  controllers: ['RovingFocusController'],
  focusModel: 'delegates-focus',
  states: ['lightbox-open'],
  keyboard: [
    { key: 'ArrowLeft / ArrowRight', when: 'thumbnail strip focused', expect: 'navigates gallery thumbnails (RTL-aware)' },
    { key: 'Home / End', when: 'thumbnail strip focused', expect: 'moves to first or last thumbnail' },
    { key: 'Enter / Space', when: 'thumbnail focused', expect: 'selects corresponding gallery item' },
  ],
  props: [
    { name: 'label', attr: 'label', type: 'string', default: '' },
    { name: 'items', attr: false, type: 'ReadonlyArray<GalleryItem> | null', default: null },
    { name: 'activeIndex', attr: 'active-index', type: 'number', default: 0 },
    { name: 'lightboxOpen', attr: 'lightbox-open', type: 'boolean', default: false },
    { name: 'loop', attr: 'loop', type: 'boolean', default: true },
    { name: 'showThumbnails', attr: 'show-thumbnails', type: 'boolean', default: true },
  ],
  events: [
    { name: 'mth-change', cancelable: false, detailType: '{ index: number; item: GalleryItem | null }' },
    { name: 'mth-lightbox-open', cancelable: false, detailType: '{ index: number }' },
    { name: 'mth-lightbox-close', cancelable: false, detailType: 'undefined' },
  ],
  slots: [],
  parts: [
    { name: 'base', description: 'Outer gallery wrapper.' },
    { name: 'slide-button', description: 'Interactive slide trigger button to open lightbox.' },
    { name: 'slide-image', description: 'Main gallery slide image.' },
    { name: 'caption', description: 'Optional slide caption.' },
    { name: 'thumbnails', description: 'Thumbnail strip container.' },
    { name: 'thumbnail', description: 'Selectable thumbnail button.' },
  ],
  messages: { ...galleryMessages },
};

export const CEM_METADATA = {
  description: 'Composite media gallery pairing public mth-carousel and mth-lightbox tags with an RTL-aware roving-focus thumbnail strip.',
  propDescriptions: {
    label: 'Accessible label for the gallery.',
    items: 'Array of GalleryItem media entries.',
    activeIndex: 'Zero-based index of the active gallery item.',
    lightboxOpen: 'Controls whether the composed mth-lightbox overlay is open.',
    loop: 'Allows wrapping slide navigation in the composed carousel.',
    showThumbnails: 'Displays the thumbnail strip below the carousel.',
  },
  eventDescriptions: {
    'mth-change': 'Fired when the active gallery item changes.',
    'mth-lightbox-open': 'Fired when a slide opens in the lightbox.',
    'mth-lightbox-close': 'Fired when the lightbox closes.',
  },
  cssProperties: [
    { name: '--mth-gallery-thumbnail-size', description: 'Inline and block size of thumbnail buttons.' },
  ],
};
