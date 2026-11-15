import { registerMthCheckoutSteps } from './element.js';

export * from './element.js';

registerMthCheckoutSteps();

declare global {
  interface HTMLElementTagNameMap {
    'mth-checkout-steps': import('./checkout-steps.js').MthCheckoutSteps;
  }
}
