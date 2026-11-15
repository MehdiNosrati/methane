import { defineComponents } from '@methane-ui/core';
import { MthEventCalendar } from './event-calendar.js';

export {
  MthEventCalendar,
  type CalendarEvent,
  type CalendarViewMode,
} from './event-calendar.js';
export { eventCalendarMessages } from './event-calendar.messages.js';
export { eventCalendarStyles } from './event-calendar.styles.js';

export function registerMthEventCalendar(prefix?: string): ReadonlyArray<string> {
  return defineComponents({
    ...(prefix !== undefined ? { prefix } : {}),
    components: { 'mth-event-calendar': MthEventCalendar },
  });
}

declare global {
  interface HTMLElementTagNameMap {
    'mth-event-calendar': MthEventCalendar;
  }
}
