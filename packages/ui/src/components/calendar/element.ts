import { defineComponents } from '@methane/core';
import { MthCalendar } from './calendar.js';

export { MthCalendar } from './calendar.js';
export { calendarMessages } from './calendar.messages.js';
export { calendarSpec } from './calendar.spec.js';
export { calendarStyles } from './calendar.styles.js';

export function registerMthCalendar(prefix?: string): ReadonlyArray<string> {
  return defineComponents({
    ...(prefix !== undefined ? { prefix } : {}),
    components: { 'mth-calendar': MthCalendar },
  });
}
