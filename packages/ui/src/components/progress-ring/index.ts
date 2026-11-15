import { registerMthProgressRing } from './element.js';
import type { MthProgressRing } from './progress-ring.js';

registerMthProgressRing();

export * from './element.js';

declare global {
  interface HTMLElementTagNameMap {
    'mth-progress-ring': MthProgressRing;
  }
}
