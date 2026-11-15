import { registerMthTimeline } from './element.js';

export * from './element.js';

registerMthTimeline();

declare global {
  interface HTMLElementTagNameMap {
    'mth-timeline': import('./timeline.js').MthTimeline;
  }
}
