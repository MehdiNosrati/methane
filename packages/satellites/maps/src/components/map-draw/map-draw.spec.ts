import type { ComponentBehaviorSpec } from '@methane/spec-compiler';
import { mapDrawMessages } from './map-draw.messages.js';

export const mapDrawSpec: ComponentBehaviorSpec = {
  tag: 'mth-map-draw',
  package: '@methane/maps',
  conformance: ['satellite', 'roving-focus'],
  controllers: ['RovingFocusController'],
  focusModel: 'host',
  states: ['disabled'],
  props: [
    { name: 'mode', attr: 'mode', type: "'select' | 'point' | 'line' | 'polygon'", default: 'point' },
    { name: 'features', attr: false, type: 'MapGeoJsonFeatureCollection' },
    { name: 'label', attr: 'label', type: 'string', default: '' },
    { name: 'disabled', attr: 'disabled', type: 'boolean', default: false },
  ],
  events: [
    { name: 'mth-draw-change', cancelable: false, detailType: '{ features: MapGeoJsonFeatureCollection }' },
    { name: 'mth-draw-mode', cancelable: false, detailType: '{ mode: DrawMode }' },
  ],
  slots: [
    { name: 'fallback', description: 'Fallback content for SSR or non-WebGL environments.' },
  ],
  parts: [
    { name: 'base', description: 'Outer region wrapper.' },
    { name: 'canvas', description: 'MapLibre canvas host.' },
    { name: 'toolbar', description: 'Drawing mode and history toolbar.' },
    { name: 'surface', description: 'Interactive SVG drawing surface.' },
    { name: 'status', description: 'Feature count and vertex summary.' },
  ],
  keyboard: [
    { key: 'ArrowLeft', dir: 'ltr', when: 'toolbar focused', expect: 'Moves focus to previous tool' },
    { key: 'ArrowRight', dir: 'ltr', when: 'toolbar focused', expect: 'Moves focus to next tool' },
    { key: 'Enter', when: 'tool focused', expect: 'Activates focused drawing tool' },
  ],
  messages: { ...mapDrawMessages },
};
