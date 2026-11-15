import { defineComponents } from '@methane-ui/core';
import { MthDateRangeCalendar } from './date-range-calendar.js';

export { MthDateRangeCalendar } from './date-range-calendar.js';
export { dateRangeCalendarMessages } from './date-range-calendar.messages.js';
export { dateRangeCalendarStyles } from './date-range-calendar.styles.js';

export function registerMthDateRangeCalendar(prefix?: string): ReadonlyArray<string> {
  return defineComponents({
    ...(prefix !== undefined ? { prefix } : {}),
    components: { 'mth-date-range-calendar': MthDateRangeCalendar },
  });
}
