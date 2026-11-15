import { defineComponents } from '@methane-ui/core';
import { MthTimelineItem } from './timeline-item.js';

export { MthTimelineItem, type MthTimelineItemVariant } from './timeline-item.js';
export { timelineItemMessages } from './timeline-item.messages.js';
export { timelineItemSpec } from './timeline-item.spec.js';
export { timelineItemStyles } from './timeline-item.styles.js';

export function registerMthTimelineItem(prefix?: string): ReadonlyArray<string> {
  return defineComponents({
    ...(prefix !== undefined ? { prefix } : {}),
    components: { 'mth-timeline-item': MthTimelineItem },
  });
}
