import type { ComponentBehaviorSpec } from '@methane-ui/spec-compiler';
import { imageMessages } from './image.messages.js';

export const imageSpec: ComponentBehaviorSpec = {
  tag: 'mth-image',
  package: '@methane-ui/ui',
  conformance: [],
  controllers: [],
  focusModel: 'none',
  states: ['loading', 'loaded', 'error'],
  keyboard: [],
  props: [
    { name: 'src', attr: 'src', type: 'string', default: '' },
    { name: 'alt', attr: 'alt', type: 'string', default: '' },
    { name: 'fallbackSrc', attr: 'fallback-src', type: 'string', default: '' },
    { name: 'aspectRatio', attr: 'aspect-ratio', type: 'string', default: '' },
    { name: 'fit', attr: 'fit', type: "'cover' | 'contain' | 'fill' | 'none' | 'scale-down'", default: 'cover' },
    { name: 'loading', attr: 'loading', type: "'lazy' | 'eager'", default: 'lazy' },
    { name: 'decoding', attr: 'decoding', type: "'async' | 'sync' | 'auto'", default: 'async' },
    { name: 'rounded', attr: 'rounded', type: 'boolean', default: false },
  ],
  events: [
    { name: 'mth-load', cancelable: false, detailType: '{ src: string }' },
    { name: 'mth-error', cancelable: false, detailType: '{ src: string }' },
  ],
  slots: [
    { name: 'placeholder', description: 'Content displayed while the image is loading.' },
    { name: 'fallback', description: 'Content displayed when the image fails to load and no fallbackSrc succeeds.' },
  ],
  parts: [
    { name: 'base', description: 'Outer aspect-ratio wrapper.' },
    { name: 'img', description: 'Underlying native img element.' },
    { name: 'placeholder', description: 'Loading placeholder container.' },
    { name: 'fallback', description: 'Error fallback container.' },
  ],
  messages: { ...imageMessages },
};

export const CEM_METADATA = {
  description: 'Accessible progressive image with safe-URL validation, aspect ratio, lazy loading, placeholder, and fallback handling.',
  propDescriptions: {
    src: 'Primary image URL (validated against safe HTTP(S)/relative protocols).',
    alt: 'Alternative text describing the image.',
    fallbackSrc: 'Optional backup URL loaded if the primary src fails.',
    aspectRatio: 'CSS aspect-ratio applied to the image container (e.g. 16/9).',
    fit: 'Object-fit mode for the rendered image.',
    loading: 'Native browser loading strategy (lazy or eager).',
    decoding: 'Image decoding hint (async, sync, or auto).',
    rounded: 'Applies rounded corner radius tokens to the container.',
  },
  eventDescriptions: {
    'mth-load': 'Fired when the active image finishes loading.',
    'mth-error': 'Fired when the image fails to load or src is rejected as unsafe.',
  },
  cssProperties: [
    { name: '--mth-image-radius', description: 'Border radius override for the image wrapper.' },
  ],
};
