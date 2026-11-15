import { registerMthTimePicker } from './element.js';

export * from './element.js';

registerMthTimePicker();

declare global {
  interface HTMLElementTagNameMap {
    'mth-time-picker': import('./time-picker.js').MthTimePicker;
  }
}
