import { registerMthGantt } from './element.js';
import type { MthGantt } from './gantt.js';

export * from './element.js';

registerMthGantt();

declare global {
  interface HTMLElementTagNameMap {
    'mth-gantt': MthGantt;
  }
}
