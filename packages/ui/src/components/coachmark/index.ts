import { registerMthCoachmark } from './element.js';
import type { MthCoachmark } from './coachmark.js';

registerMthCoachmark();

export * from './element.js';

declare global {
  interface HTMLElementTagNameMap {
    'mth-coachmark': MthCoachmark;
  }
}
