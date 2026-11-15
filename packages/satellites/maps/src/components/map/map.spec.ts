import type { ComponentBehaviorSpec } from '@methane/spec-compiler';
import { mapMessages } from './map.messages.js';

export const mapSpec: ComponentBehaviorSpec = {
  tag: 'mth-map',
  package: '@methane/maps',
  conformance: ['satellite'],
  controllers: [],
  focusModel: 'host',
  states: ['interactive'],
  props: [
    { name: 'centerLat', attr: 'center-lat', type: 'number', default: 37.7749 },
    { name: 'centerLng', attr: 'center-lng', type: 'number', default: -122.4194 },
    { name: 'zoom', attr: 'zoom', type: 'number', default: 11 },
    { name: 'minZoom', attr: 'min-zoom', type: 'number', default: 0 },
    { name: 'maxZoom', attr: 'max-zoom', type: 'number', default: 22 },
    { name: 'bearing', attr: 'bearing', type: 'number', default: 0 },
    { name: 'pitch', attr: 'pitch', type: 'number', default: 0 },
    { name: 'interactive', attr: 'interactive', type: 'boolean', default: true },
    { name: 'label', attr: 'label', type: 'string', default: '' },
    { name: 'mapStyle', attr: false, type: 'string | StyleSpecification | undefined' },
    { name: 'markers', attr: false, type: 'ReadonlyArray<MapMarker>' },
  ],
  events: [
    { name: 'mth-map-move', cancelable: false, detailType: '{ center: readonly [number, number]; zoom: number }' },
    { name: 'mth-marker-select', cancelable: false, detailType: '{ id: string; lng: number; lat: number; label: string }' },
  ],
  slots: [
    { name: '', description: 'Overlay widgets placed inside the map viewport.' },
    { name: 'fallback', description: 'SSR or non-WebGL fallback content displayed when WebGL is unavailable.' },
  ],
  parts: [
    { name: 'base', description: 'Outer region wrapper.' },
    { name: 'canvas', description: 'MapLibre WebGL canvas host element.' },
    { name: 'controls', description: 'Zoom and reset controls group.' },
    { name: 'marker', description: 'Interactive marker button.' },
    { name: 'status', description: 'Accessible coordinate and zoom readout.' },
  ],
  keyboard: [
    { key: 'ArrowLeft', dir: 'ltr', when: 'viewport focused', expect: 'Pans map west' },
    { key: 'ArrowRight', dir: 'rtl', when: 'viewport focused', expect: 'Pans map west in RTL' },
    { key: 'ArrowUp', when: 'viewport focused', expect: 'Pans map north' },
    { key: 'ArrowDown', when: 'viewport focused', expect: 'Pans map south' },
    { key: '+', when: 'viewport focused', expect: 'Zooms in by 1 level' },
    { key: '-', when: 'viewport focused', expect: 'Zooms out by 1 level' },
    { key: 'Home', when: 'viewport focused', expect: 'Resets map view' },
  ],
  messages: { ...mapMessages },
};

export const CEM_METADATA = {
  description: 'Interactive MapLibre GL JS map canvas with RTL-aware panning, zoom controls, markers, and SSR fallback.',
  propDescriptions: {
    centerLat: 'Viewport center latitude in decimal degrees.',
    centerLng: 'Viewport center longitude in decimal degrees.',
    zoom: 'Current map zoom level.',
    minZoom: 'Minimum allowed zoom level.',
    maxZoom: 'Maximum allowed zoom level.',
    bearing: 'Map bearing rotation in degrees.',
    pitch: 'Map tilt pitch in degrees.',
    interactive: 'Enables interactive pan/zoom controls and keyboard navigation.',
    label: 'Accessible region label for the map.',
    mapStyle: 'Safe HTTP/HTTPS/relative style URL or MapLibre StyleSpecification object.',
    markers: 'Array of interactive markers plotted inside the map viewport.',
  },
  eventDescriptions: {
    'mth-map-move': 'Fired after programmatic, button, or keyboard pan/zoom view changes.',
    'mth-marker-select': 'Fired when an interactive map marker is activated.',
  },
  cssProperties: [
    { name: '--mth-color-surface', description: 'Map container surface background.' },
    { name: '--mth-color-border', description: 'Map container border color.' },
    { name: '--mth-color-accent', description: 'Interactive marker accent background.' },
    { name: '--mth-color-accent-fg', description: 'Interactive marker foreground text color.' },
    { name: '--mth-color-border-focus', description: 'Focus-visible outline color.' },
  ],
};
