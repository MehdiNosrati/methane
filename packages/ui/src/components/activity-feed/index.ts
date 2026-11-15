import { registerMthActivityFeed } from './element.js';

export * from './element.js';

registerMthActivityFeed();

declare global {
  interface HTMLElementTagNameMap {
    'mth-activity-feed': import('./activity-feed.js').MthActivityFeed;
  }
}
