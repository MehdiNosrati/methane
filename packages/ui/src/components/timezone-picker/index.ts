import { registerMthTimezonePicker } from './element.js';

export * from './element.js';

registerMthTimezonePicker();

declare global {
  interface HTMLElementTagNameMap {
    'mth-timezone-picker': import('./timezone-picker.js').MthTimezonePicker;
  }
}
