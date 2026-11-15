import type { ComponentBehaviorSpec } from '@methane/spec-compiler';
import { carouselMessages } from './carousel.messages.js';

export const carouselSpec: ComponentBehaviorSpec = {
  tag: 'mth-carousel',
  package: '@methane/ui',
  conformance: ['roving-focus'],
  controllers: ['SlotCollectionController', 'RovingFocusController', 'ObserverPoolController', 'MotionController'],
  focusModel: 'delegates-focus',
  states: ['autoplay'],
  keyboard: [
    { key: 'ArrowLeft / ArrowRight', when: 'slide indicator focused', expect: 'navigates between slides (RTL-aware)' },
    { key: 'Home / End', when: 'slide indicator focused', expect: 'jumps to first or last slide indicator' },
    { key: 'Enter / Space', when: 'prev/next/indicator focused', expect: 'selects target slide and updates scroll track' },
  ],
  props: [
    { name: 'label', attr: 'label', type: 'string', default: '' },
    { name: 'currentIndex', attr: 'current-index', type: 'number', default: 0 },
    { name: 'slidesPerView', attr: 'slides-per-view', type: 'number', default: 1 },
    { name: 'loop', attr: 'loop', type: 'boolean', default: false },
    { name: 'autoplay', attr: 'autoplay', type: 'boolean', default: false },
    { name: 'interval', attr: 'interval', type: 'number', default: 5000 },
    { name: 'showControls', attr: 'show-controls', type: 'boolean', default: true },
    { name: 'showIndicators', attr: 'show-indicators', type: 'boolean', default: true },
  ],
  events: [
    { name: 'mth-change', cancelable: false, detailType: '{ index: number; total: number }' },
  ],
  slots: [{ name: '', description: 'Slot for mth-carousel-item slides.' }],
  parts: [
    { name: 'base', description: 'Outer carousel region container.' },
    { name: 'track', description: 'Scroll-snap slide track.' },
    { name: 'controls', description: 'Previous/next button group.' },
    { name: 'prev-button', description: 'Previous slide button.' },
    { name: 'next-button', description: 'Next slide button.' },
    { name: 'indicators', description: 'Slide pagination indicator bar.' },
    { name: 'indicator', description: 'Individual slide indicator button.' },
  ],
  messages: { ...carouselMessages },
};

export const CEM_METADATA = {
  description: 'Scroll-snap carousel supporting progressive CSS ::scroll-button enhancement, JS prev/next controls, RTL-aware roving focus indicators, and autoplay.',
  propDescriptions: {
    label: 'Accessible region label for the carousel.',
    currentIndex: 'Zero-based index of the currently active slide.',
    slidesPerView: 'Number of slides visible per viewport width.',
    loop: 'Wraps navigation from last slide back to first and vice versa.',
    autoplay: 'Automatically advances slides on the configured interval.',
    interval: 'Autoplay interval duration in milliseconds.',
    showControls: 'Displays previous and next navigation buttons.',
    showIndicators: 'Displays slide pagination indicator dots.',
  },
  eventDescriptions: {
    'mth-change': 'Fired when the active slide index changes.',
  },
  cssProperties: [
    { name: '--mth-carousel-gap', description: 'Inline gap between slides.' },
  ],
};
