import type { ComponentBehaviorSpec } from '@methane/spec-compiler';
import { floorPlanMessages } from './floor-plan.messages.js';

export const floorPlanSpec: ComponentBehaviorSpec = {
  tag: 'mth-floor-plan',
  package: '@methane/maps',
  conformance: ['roving-focus', 'satellite'],
  controllers: ['RovingFocusController', 'SelectionController'],
  focusModel: 'host',
  states: ['multiple'],
  props: [
    { name: 'rooms', attr: false, type: 'ReadonlyArray<FloorPlanRoom>' },
    { name: 'selectedIds', attr: false, type: 'ReadonlyArray<string>' },
    { name: 'level', attr: 'level', type: 'string', default: '1' },
    { name: 'zoom', attr: 'zoom', type: 'number', default: 1 },
    { name: 'panX', attr: 'pan-x', type: 'number', default: 0 },
    { name: 'panY', attr: 'pan-y', type: 'number', default: 0 },
    { name: 'multiple', attr: 'multiple', type: 'boolean', default: false },
    { name: 'label', attr: 'label', type: 'string', default: '' },
  ],
  events: [
    { name: 'mth-room-select', cancelable: false, detailType: '{ selectedIds: ReadonlyArray<string>; room: FloorPlanRoom }' },
    { name: 'mth-floor-zoom', cancelable: false, detailType: '{ zoom: number; panX: number; panY: number }' },
  ],
  slots: [
    { name: 'fallback', description: 'Fallback content for SSR or non-WebGL environments.' },
  ],
  parts: [
    { name: 'base', description: 'Outer region wrapper.' },
    { name: 'viewport', description: 'Pannable and zoomable SVG container.' },
    { name: 'svg', description: 'Vector indoor floor plan.' },
    { name: 'rooms', description: 'Accessible roving room directory.' },
    { name: 'room-button', description: 'Interactive room selector button.' },
  ],
  keyboard: [
    { key: 'ArrowLeft', dir: 'ltr', when: 'room directory focused', expect: 'Moves focus to previous room' },
    { key: 'ArrowRight', dir: 'ltr', when: 'room directory focused', expect: 'Moves focus to next room' },
    { key: 'Enter', when: 'room focused', expect: 'Selects or toggles room' },
  ],
  messages: { ...floorPlanMessages },
};
