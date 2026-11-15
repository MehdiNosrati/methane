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
