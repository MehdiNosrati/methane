import { registerMthCalendar } from './element.js';

export * from './element.js';

registerMthCalendar();

declare global {
  interface HTMLElementTagNameMap {
    'mth-calendar': import('./calendar.js').MthCalendar;
  }
}
