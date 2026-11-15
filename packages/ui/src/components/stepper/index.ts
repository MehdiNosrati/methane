import { registerMthStepper } from './element.js';

export * from './element.js';

registerMthStepper();

declare global {
  interface HTMLElementTagNameMap {
    'mth-stepper': import('./stepper.js').MthStepper;
  }
}
