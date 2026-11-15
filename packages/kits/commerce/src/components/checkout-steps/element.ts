import { defineComponents } from '@methane-ui/core';
import { MthCheckoutSteps } from './checkout-steps.js';

export { MthCheckoutSteps, type CheckoutStep } from './checkout-steps.js';
export { checkoutStepsMessages } from './checkout-steps.messages.js';

export function registerMthCheckoutSteps(prefix?: string): ReadonlyArray<string> {
  return defineComponents({
    ...(prefix !== undefined ? { prefix } : {}),
    components: { 'mth-checkout-steps': MthCheckoutSteps },
  });
}
