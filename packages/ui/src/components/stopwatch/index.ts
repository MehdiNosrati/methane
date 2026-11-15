import { registerMthStopwatch } from './element.js';

export * from './element.js';

registerMthStopwatch();

declare global {
  interface HTMLElementTagNameMap {
    'mth-stopwatch': import('./stopwatch.js').MthStopwatch;
  }
}
