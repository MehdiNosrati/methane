import { registerMthScheduler } from './element.js';
import type { MthScheduler } from './scheduler.js';

export * from './element.js';

registerMthScheduler();

declare global {
  interface HTMLElementTagNameMap {
    'mth-scheduler': MthScheduler;
  }
}
