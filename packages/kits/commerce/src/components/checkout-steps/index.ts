import { getRuntime } from '@methane-ui/core';
import { MthCheckoutSteps } from './element.js';

export { MthCheckoutSteps, type CheckoutStep } from './element.js';
export { checkoutStepsMessages } from './checkout-steps.messages.js';
export { checkoutStepsSpec } from './checkout-steps.spec.js';

export function registerMthCheckoutSteps(prefix = 'mth'): ReadonlyArray<string> {
  return getRuntime().registry.defineComponents({
    prefix,
    components: {
      'mth-checkout-steps': MthCheckoutSteps,
    },
  });
}

registerMthCheckoutSteps();
