import { registerMthCalendarHeatmap } from './element.js';

export * from './element.js';

registerMthCalendarHeatmap();

declare global {
  interface HTMLElementTagNameMap {
    'mth-calendar-heatmap': import('./calendar-heatmap.js').MthCalendarHeatmap;
  }
}
