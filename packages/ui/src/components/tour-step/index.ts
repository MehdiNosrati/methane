import { registerMthTourStep } from './element.js';
import type { MthTourStep } from './tour-step.js';

registerMthTourStep();

export * from './element.js';

declare global {
  interface HTMLElementTagNameMap {
    'mth-tour-step': MthTourStep;
  }
}
