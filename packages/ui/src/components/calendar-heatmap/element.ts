import { defineComponents } from '@methane/core';
import { MthCalendarHeatmap } from './calendar-heatmap.js';

export {
  MthCalendarHeatmap,
  type CalendarHeatmapEntry,
} from './calendar-heatmap.js';
export { calendarHeatmapMessages } from './calendar-heatmap.messages.js';
export { calendarHeatmapSpec } from './calendar-heatmap.spec.js';
export { calendarHeatmapStyles } from './calendar-heatmap.styles.js';

export function registerMthCalendarHeatmap(prefix?: string): ReadonlyArray<string> {
  return defineComponents({
    ...(prefix !== undefined ? { prefix } : {}),
    components: { 'mth-calendar-heatmap': MthCalendarHeatmap },
  });
}
