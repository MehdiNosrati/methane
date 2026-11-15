import type { ComponentBehaviorSpec } from '@methane-ui/spec-compiler';
import { zoomPanMessages } from './zoom-pan.messages.js';

export const zoomPanSpec: ComponentBehaviorSpec = {
  tag: 'mth-zoom-pan',
  package: '@methane-ui/ui',
  conformance: [],
  controllers: [],
  focusModel: 'delegates-focus',
  states: ['zoomed'],
  keyboard: [
    { key: '+ / =', when: 'viewport focused', expect: 'zooms in by step up to maxScale' },
    { key: '-', when: 'viewport focused', expect: 'zooms out by step down to minScale' },
    { key: '0', when: 'viewport focused', expect: 'resets zoom and pan offset' },
    { key: 'Arrow keys', when: 'zoomed and viewport focused', expect: 'pans viewport offset (RTL-aware)' },
  ],
  props: [
    { name: 'scale', attr: 'scale', type: 'number', default: 1 },
    { name: 'minScale', attr: 'min-scale', type: 'number', default: 1 },
    { name: 'maxScale', attr: 'max-scale', type: 'number', default: 4 },
    { name: 'step', attr: 'step', type: 'number', default: 0.25 },
    { name: 'panX', attr: 'pan-x', type: 'number', default: 0 },
    { name: 'panY', attr: 'pan-y', type: 'number', default: 0 },
    { name: 'label', attr: 'label', type: 'string', default: '' },
    { name: 'showControls', attr: 'show-controls', type: 'boolean', default: true },
  ],
  events: [
    { name: 'mth-change', cancelable: false, detailType: '{ scale: number; panX: number; panY: number }' },
  ],
  slots: [{ name: '', description: 'Zoomable and pannable content.' }],
  parts: [
    { name: 'base', description: 'Outer zoom-pan stage.' },
    { name: 'viewport', description: 'Focusable interactive pan/zoom stage.' },
    { name: 'content', description: 'Transformed content wrapper.' },
    { name: 'controls', description: 'Zoom control toolbar.' },
    { name: 'zoom-in', description: 'Zoom in button.' },
    { name: 'zoom-out', description: 'Zoom out button.' },
    { name: 'reset', description: 'Reset zoom button.' },
  ],
  messages: { ...zoomPanMessages },
};

export const CEM_METADATA = {
  description: 'Accessible zoom and pan viewport with toolbar buttons, mouse wheel zoom, pointer pan, keyboard pan/zoom, and adopted CSSStyleSheet transforms.',
  propDescriptions: {
    scale: 'Current zoom multiplier.',
    minScale: 'Minimum allowed zoom scale.',
    maxScale: 'Maximum allowed zoom scale.',
    step: 'Zoom scale increment per control/wheel step.',
    panX: 'Horizontal pan offset in pixels.',
    panY: 'Vertical pan offset in pixels.',
    label: 'Accessible region label.',
    showControls: 'Displays zoom-in, zoom-out, and reset toolbar buttons.',
  },
  eventDescriptions: {
    'mth-change': 'Fired when scale or pan coordinates change.',
  },
  cssProperties: [],
};
