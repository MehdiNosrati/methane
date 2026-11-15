import type { ComponentBehaviorSpec } from '@methane-ui/spec-compiler';

export const timelineSpec: ComponentBehaviorSpec = {
  tag: 'mth-timeline',
  package: '@methane-ui/ui',
  conformance: [],
  controllers: ['SlotCollectionController'],
  focusModel: 'none',
  role: 'list',
  states: ['horizontal'],
  keyboard: [],
  props: [
    { name: 'orientation', attr: 'orientation', type: "'vertical' | 'horizontal'", default: 'vertical' },
    { name: 'align', attr: 'align', type: "'start' | 'alternate' | 'end'", default: 'start' },
    { name: 'items', attr: false, type: 'ReadonlyArray<TimelineItemData> | null', default: null },
    { name: 'label', attr: 'label', type: 'string', default: '' },
  ],
  events: [],
  slots: [
    { name: '', description: 'Slotted `<mth-timeline-item>` entries.' },
    { name: 'empty', description: 'Fallback content when no items are present.' },
  ],
  parts: [
    { name: 'base', description: 'Outer semantic `role="list"` timeline container.' },
    { name: 'item', description: 'Rendered item container when using imperative `.items` data.' },
    { name: 'empty', description: 'Empty fallback container.' },
  ],
  messages: {
    timelineLabel: 'Timeline',
    emptyText: 'No events',
  },
};

export const CEM_METADATA = {
  description: 'Chronological timeline container coordinating declarative `<mth-timeline-item>` children or imperative `.items` arrays via `SlotCollectionController`.',
  propDescriptions: {
    orientation: 'Axis of timeline layout (`vertical` or `horizontal`).',
    align: 'Horizontal alignment mode (`start`, `alternate`, or `end`).',
    items: 'Optional imperative timeline entries when not using slotted `<mth-timeline-item>` elements.',
    label: 'Accessible label for the timeline list.',
  },
  eventDescriptions: {},
  cssProperties: [
    { name: '--mth-color-border', description: 'Connector line color.' },
    { name: '--mth-space-3', description: 'Gap between timeline entries.' },
  ],
};
