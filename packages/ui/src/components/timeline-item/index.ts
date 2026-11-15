import { registerMthTimelineItem } from './element.js';

export * from './element.js';

registerMthTimelineItem();

declare global {
  interface HTMLElementTagNameMap {
    'mth-timeline-item': import('./timeline-item.js').MthTimelineItem;
  }
}
