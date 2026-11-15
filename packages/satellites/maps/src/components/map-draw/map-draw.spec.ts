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

export const CEM_METADATA = {
  description: 'Interactive GeoJSON drawing surface supporting points, lines, polygons, keyboard drawing, and undo/redo.',
  propDescriptions: {
    mode: 'Active drawing mode (`select`, `point`, `line`, `polygon`).',
    features: 'Current GeoJSON FeatureCollection.',
    label: 'Accessible region label.',
    disabled: 'Disables toolbar controls and drawing input.',
  },
  eventDescriptions: {
    'mth-draw-change': 'Fired when features are added, undone, redone, or cleared.',
    'mth-draw-mode': 'Fired when the active drawing mode changes.',
  },
  cssProperties: [
    { name: '--mth-color-surface', description: 'Drawing container surface background.' },
    { name: '--mth-color-accent', description: 'Active drawing mode and shape stroke/fill accent color.' },
    { name: '--mth-color-accent-fg', description: 'Pressed mode button foreground color.' },
    { name: '--mth-color-border-focus', description: 'Focus-visible outline color.' },
  ],
};
