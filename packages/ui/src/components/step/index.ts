import { registerMthStep } from './element.js';

export * from './element.js';

registerMthStep();

declare global {
  interface HTMLElementTagNameMap {
    'mth-step': import('./step.js').MthStep;
  }
}
