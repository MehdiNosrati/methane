import type { ComponentBehaviorSpec } from '@methane/spec-compiler';

export const imageCropperSpec: ComponentBehaviorSpec = {
  tag: 'mth-image-cropper',
  package: '@methane/ui',
  conformance: [],
  controllers: [],
  focusModel: 'delegates-focus',
  states: ['disabled'],
  keyboard: [
    { key: 'ArrowLeft', when: 'Crop viewport is focused', expect: 'Nudges image offset horizontally to the left' },
    { key: 'ArrowRight', when: 'Crop viewport is focused', expect: 'Nudges image offset horizontally to the right' },
    { key: 'ArrowUp', when: 'Crop viewport is focused', expect: 'Nudges image offset vertically up' },
    { key: 'ArrowDown', when: 'Crop viewport is focused', expect: 'Nudges image offset vertically down' },
  ],
  props: [
    { name: 'src', attr: 'src', type: 'string', default: '' },
    { name: 'alt', attr: 'alt', type: 'string', default: '' },
    { name: 'aspectRatio', attr: 'aspect-ratio', type: 'number', default: 1 },
    { name: 'zoom', attr: 'zoom', type: 'number', default: 1 },
    { name: 'offsetX', attr: 'offset-x', type: 'number', default: 0 },
    { name: 'offsetY', attr: 'offset-y', type: 'number', default: 0 },
    { name: 'disabled', attr: 'disabled', type: 'boolean', default: false },
  ],
  events: [
    { name: 'mth-change', cancelable: false, detailType: '{ zoom: number; offsetX: number; offsetY: number }' },
    { name: 'mth-crop', cancelable: false, detailType: '{ zoom: number; offsetX: number; offsetY: number; aspectRatio: number; dataUrl: string }' },
  ],
  slots: [],
  parts: [
    { name: 'base', description: 'Root image cropper container.' },
    { name: 'viewport', description: 'Keyboard-interactive crop frame container.' },
    { name: 'image', description: 'Safe <img> preview element.' },
    { name: 'frame', description: 'Visual crop reticle overlay.' },
    { name: 'controls', description: 'Zoom, pan, reset, and crop controls.' },
    { name: 'crop-button', description: 'Button that triggers crop export.' },
    { name: 'reset-button', description: 'Button that resets zoom and pan offsets.' },
  ],
  messages: {
    viewportLabel: 'Image crop area. Use arrow keys to pan.',
    zoomLabel: 'Zoom',
    panXLabel: 'Horizontal offset',
    panYLabel: 'Vertical offset',
    cropAction: 'Crop',
    resetAction: 'Reset',
  },
};

export const CEM_METADATA = {
  description: 'Accessible image cropper with zoom/pan controls, keyboard arrow nudging, safe <img> SVG rendering, and canvas crop export.',
  propDescriptions: {
    src: 'Safe image URL (https, http, blob, relative path, or safe raster/svg data URI) rendered only via <img>.',
    alt: 'Accessible alternative text for the source image.',
    aspectRatio: 'Target crop aspect ratio (width / height, 0 for free).',
    zoom: 'Zoom scale factor between 1 and 3.',
    offsetX: 'Horizontal pan offset percentage (-50 to 50).',
    offsetY: 'Vertical pan offset percentage (-50 to 50).',
    disabled: 'Disables cropper controls.',
  },
  eventDescriptions: {
    'mth-change': 'Fired when zoom or pan offset changes.',
    'mth-crop': 'Fired when crop() completes.',
  },
  cssProperties: [
    { name: '--mth-color-surface', description: 'Viewport background.' },
    { name: '--mth-color-accent', description: 'Crop frame highlight border.' },
    { name: '--mth-color-border', description: 'Container border color.' },
  ],
};
