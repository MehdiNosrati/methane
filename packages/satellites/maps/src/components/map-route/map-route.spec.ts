import type { ComponentBehaviorSpec } from '@methane/spec-compiler';
import { mapRouteMessages } from './map-route.messages.js';

export const mapRouteSpec: ComponentBehaviorSpec = {
  tag: 'mth-map-route',
  package: '@methane/maps',
  conformance: ['satellite'],
  controllers: [],
  focusModel: 'host',
  states: [],
  props: [
    { name: 'origin', attr: false, type: 'RouteWaypoint | null', default: null },
    { name: 'destination', attr: false, type: 'RouteWaypoint | null', default: null },
    { name: 'waypoints', attr: false, type: 'ReadonlyArray<RouteWaypoint>' },
    { name: 'unit', attr: 'unit', type: "'km' | 'mi'", default: 'km' },
    { name: 'label', attr: 'label', type: 'string', default: '' },
  ],
  events: [
    { name: 'mth-route-fit', cancelable: false, detailType: '{ bounds: BoundsTuple; distanceKm: number }' },
    { name: 'mth-waypoint-select', cancelable: false, detailType: '{ waypoint: RouteWaypoint; index: number }' },
  ],
  slots: [
    { name: 'fallback', description: 'Fallback content for SSR or non-WebGL environments.' },
  ],
  parts: [
    { name: 'base', description: 'Outer region wrapper.' },
    { name: 'canvas', description: 'MapLibre canvas host.' },
    { name: 'polyline', description: 'SVG route visualization.' },
    { name: 'stops', description: 'Accessible ordered stop list.' },
    { name: 'summary', description: 'Total route distance summary.' },
  ],
  keyboard: [
    { key: 'Enter', when: 'stop button focused', expect: 'Centers map on selected route stop' },
  ],
  messages: { ...mapRouteMessages },
};

export const CEM_METADATA = {
  description: 'Route path visualizer computing Haversine distance and interactive bounds fitting across ordered stops.',
  propDescriptions: {
    origin: 'Starting route waypoint (`lng`, `lat`, optional `label`).',
    destination: 'Ending route waypoint (`lng`, `lat`, optional `label`).',
    waypoints: 'Intermediate ordered route waypoints.',
    unit: 'Distance unit displayed in the summary (`km` or `mi`).',
    label: 'Accessible region label.',
  },
  eventDescriptions: {
    'mth-route-fit': 'Fired when bounds are fitted across route stops.',
    'mth-waypoint-select': 'Fired when a route stop button is selected.',
  },
  cssProperties: [
    { name: '--mth-color-surface', description: 'Route card surface background.' },
    { name: '--mth-color-border', description: 'Container and stop button border color.' },
    { name: '--mth-color-accent', description: 'Route polyline and active stop accent color.' },
    { name: '--mth-color-border-focus', description: 'Focus-visible outline color.' },
  ],
};
