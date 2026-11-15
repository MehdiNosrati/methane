import type { ComponentBehaviorSpec } from '@methane-ui/spec-compiler';
import { carouselItemMessages } from './carousel-item.messages.js';

export const carouselItemSpec: ComponentBehaviorSpec = {
  tag: 'mth-carousel-item',
  package: '@methane-ui/ui',
  conformance: [],
  controllers: [],
  focusModel: 'none',
  states: ['active'],
  keyboard: [],
  props: [
    { name: 'label', attr: 'label', type: 'string', default: '' },
    { name: 'value', attr: 'value', type: 'string', default: '' },
    { name: 'active', attr: 'active', type: 'boolean', default: false },
  ],
  events: [],
  slots: [{ name: '', description: 'Slide content.' }],
  parts: [{ name: 'base', description: 'Slide wrapper.' }],
  messages: { ...carouselItemMessages },
};

export const CEM_METADATA = {
  description: 'Individual slide item slotted inside an mth-carousel.',
  propDescriptions: {
    label: 'Accessible slide label announced for this slide.',
    value: 'Optional unique slide identifier.',
    active: 'Whether this slide is currently the active slide.',
  },
  eventDescriptions: {},
  cssProperties: [],
};
