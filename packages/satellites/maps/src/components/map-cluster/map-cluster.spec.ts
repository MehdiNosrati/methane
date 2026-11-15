import type { ComponentBehaviorSpec } from '@methane/spec-compiler';
import { mapClusterMessages } from './map-cluster.messages.js';

export const mapClusterSpec: ComponentBehaviorSpec = {
  tag: 'mth-map-cluster',
  package: '@methane/maps',
  conformance: ['satellite', 'roving-focus'],
  controllers: ['RovingFocusController'],
  focusModel: 'host',
  states: [],
  props: [
    { name: 'points', attr: false, type: 'ReadonlyArray<ClusterPoint>' },
    { name: 'radius', attr: 'radius', type: 'number', default: 48 },
    { name: 'zoom', attr: 'zoom', type: 'number', default: 4 },
    { name: 'maxZoom', attr: 'max-zoom', type: 'number', default: 18 },
    { name: 'label', attr: 'label', type: 'string', default: '' },
  ],
  events: [
    { name: 'mth-cluster-expand', cancelable: false, detailType: '{ clusterId: string; count: number; center: readonly [number, number]; zoom: number }' },
    { name: 'mth-cluster-select', cancelable: false, detailType: '{ point: ClusterPoint }' },
  ],
  slots: [
    { name: 'fallback', description: 'Fallback content for SSR or non-WebGL environments.' },
  ],
  parts: [
    { name: 'base', description: 'Outer region container.' },
    { name: 'canvas', description: 'MapLibre canvas host.' },
    { name: 'clusters', description: 'Accessible cluster list.' },
    { name: 'cluster-item', description: 'Interactive cluster or point button.' },
    { name: 'summary', description: 'Cluster count summary.' },
  ],
  keyboard: [
    { key: 'ArrowLeft', dir: 'ltr', when: 'cluster toolbar focused', expect: 'Moves focus to previous cluster item' },
    { key: 'ArrowRight', dir: 'ltr', when: 'cluster toolbar focused', expect: 'Moves focus to next cluster item' },
    { key: 'Enter', when: 'cluster item focused', expect: 'Expands focused cluster or selects point' },
  ],
  messages: { ...mapClusterMessages },
};
