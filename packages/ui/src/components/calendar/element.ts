import { defineComponents } from '@methane-ui/core';
import { MthCalendar } from './calendar.js';

export { MthCalendar } from './calendar.js';
export { calendarMessages } from './calendar.messages.js';
export { calendarStyles } from './calendar.styles.js';

export function registerMthCalendar(prefix?: string): ReadonlyArray<string> {
  return defineComponents({
    ...(prefix !== undefined ? { prefix } : {}),
    components: { 'mth-calendar': MthCalendar },
  });
}
