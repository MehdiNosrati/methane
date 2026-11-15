import { defineComponents } from '@methane-ui/core';
import { MthActivityFeed } from './activity-feed.js';

export { MthActivityFeed, type ActivityFeedEntry } from './activity-feed.js';
export { activityFeedMessages } from './activity-feed.messages.js';
export { activityFeedSpec } from './activity-feed.spec.js';
export { activityFeedStyles } from './activity-feed.styles.js';

export function registerMthActivityFeed(prefix?: string): ReadonlyArray<string> {
  return defineComponents({
    ...(prefix !== undefined ? { prefix } : {}),
    components: { 'mth-activity-feed': MthActivityFeed },
  });
}
