import type { ComponentBehaviorSpec } from '@methane/spec-compiler';

export const timelineItemSpec: ComponentBehaviorSpec = {
  tag: 'mth-timeline-item',
  package: '@methane/ui',
  conformance: [],
  controllers: [],
  focusModel: 'host',
  role: 'listitem',
  states: ['active'],
  keyboard: [],
  props: [
    { name: 'heading', attr: 'heading', type: 'string', default: '' },
    { name: 'timestamp', attr: 'timestamp', type: 'string', default: '' },
    { name: 'variant', attr: 'variant', type: "'neutral' | 'accent' | 'success' | 'warning' | 'danger'", default: 'neutral' },
    { name: 'active', attr: 'active', type: 'boolean', default: false },
  ],
  events: [],
  slots: [
    { name: 'dot', description: 'Custom marker icon inside the timeline node dot.' },
    { name: 'heading', description: 'Event title slot.' },
    { name: 'timestamp', description: 'Event timestamp slot.' },
    { name: '', description: 'Event body/description content.' },
    { name: 'meta', description: 'Optional trailing metadata or actions.' },
  ],
  parts: [
    { name: 'base', description: 'Outer timeline item grid container.' },
    { name: 'rail', description: 'Marker dot and connecting line rail.' },
    { name: 'dot', description: 'Timeline node marker circle.' },
    { name: 'connector', description: 'Connecting line between consecutive timeline items.' },
    { name: 'content', description: 'Event header and body column.' },
    { name: 'heading', description: 'Event heading container.' },
    { name: 'timestamp', description: 'Timestamp container.' },
    { name: 'body', description: 'Event description slot wrapper.' },
    { name: 'meta', description: 'Metadata slot wrapper.' },
  ],
  messages: {
    itemLabel: 'Timeline event',
  },
};

export const CEM_METADATA = {
  description: 'Individual chronological milestone entry inside `<mth-timeline>` with marker dot, connector rail, timestamp, and content slots.',
  propDescriptions: {
    heading: 'Event title text when `heading` slot is omitted.',
    timestamp: 'Timestamp label when `timestamp` slot is omitted.',
    variant: 'Semantic accent color for the marker dot (`neutral`, `accent`, `success`, `warning`, `danger`).',
    active: 'Highlights the timeline entry as current/active.',
  },
  eventDescriptions: {},
  cssProperties: [
    { name: '--mth-color-border', description: 'Connector line color.' },
    { name: '--mth-color-accent', description: 'Active marker dot color.' },
  ],
};
