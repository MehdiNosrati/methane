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
