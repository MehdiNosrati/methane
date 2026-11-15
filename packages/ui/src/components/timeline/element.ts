import { defineComponents } from '@methane-ui/core';
import { MthTimeline } from './timeline.js';

export {
  MthTimeline,
  type MthTimelineAlign,
  type MthTimelineOrientation,
  type TimelineItemData,
} from './timeline.js';
export { timelineMessages } from './timeline.messages.js';
export { timelineStyles } from './timeline.styles.js';

export function registerMthTimeline(prefix?: string): ReadonlyArray<string> {
  return defineComponents({
    ...(prefix !== undefined ? { prefix } : {}),
    components: { 'mth-timeline': MthTimeline },
  });
}
