import type { ComponentBehaviorSpec } from '@methane/spec-compiler';
import { accordionMessages } from './accordion.messages.js';

export const accordionSpec: ComponentBehaviorSpec = {
  tag: 'mth-accordion',
  package: '@methane/ui',
  conformance: ['roving-focus'],
  controllers: ['RovingFocusController', 'SelectionController', 'SlotCollectionController'],
  focusModel: 'none',
  states: ['multiple'],
  keyboard: [
    { key: 'ArrowDown', when: 'focus is on an item trigger', expect: 'moves focus to next enabled item trigger' },
    { key: 'ArrowUp', when: 'focus is on an item trigger', expect: 'moves focus to previous enabled item trigger' },
    { key: 'Home', when: 'focus is on an item trigger', expect: 'moves focus to first enabled item trigger' },
    { key: 'End', when: 'focus is on an item trigger', expect: 'moves focus to last enabled item trigger' },
  ],
  props: [
    { name: 'multiple', attr: 'multiple', type: 'boolean', default: false },
    { name: 'collapsible', attr: 'collapsible', type: 'boolean', default: true },
    { name: 'value', attr: 'value', type: 'string', default: '' },
  ],
  events: [
    {
      name: 'mth-change',
      cancelable: false,
      detailType: '{ value: string }',
    },
  ],
  slots: [
    { name: '', description: 'Slotted `<mth-accordion-item>` disclosure sections.' },
  ],
  parts: [
    { name: 'base', description: 'Root accordion container.' },
  ],
  messages: { ...accordionMessages },
};

export const CEM_METADATA = {
  description:
    'Vertically stacked disclosure group coordinating `<mth-accordion-item>` expansion via `SelectionController`, `SlotCollectionController`, and `RovingFocusController`.',
  propDescriptions: {
    multiple: 'Allows multiple accordion items to be expanded simultaneously.',
    collapsible: 'Allows collapsing all items (when false, at least one item stays expanded).',
    value: 'Currently expanded item value (comma-separated when `multiple` is true).',
  },
  eventDescriptions: {
    'mth-change': 'Fired when expanded item selection changes via user interaction.',
  },
  cssProperties: [
    { name: '--mth-color-border', description: 'Outer accordion border color.' },
    { name: '--mth-radius-md', description: 'Outer accordion corner radius.' },
  ],
};
