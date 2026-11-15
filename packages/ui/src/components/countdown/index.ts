import { registerMthCountdown } from './element.js';

export * from './element.js';

registerMthCountdown();

declare global {
  interface HTMLElementTagNameMap {
    'mth-countdown': import('./countdown.js').MthCountdown;
  }
}
