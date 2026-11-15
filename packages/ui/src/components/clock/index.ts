import { registerMthClock } from './element.js';

export * from './element.js';

registerMthClock();

declare global {
  interface HTMLElementTagNameMap {
    'mth-clock': import('./clock.js').MthClock;
  }
}
