import { defineComponents } from '@methane-ui/core';
import { MthPaymentForm } from './payment-form.js';

export { MthPaymentForm } from './payment-form.js';
export { paymentFormMessages } from './payment-form.messages.js';

export function registerMthPaymentForm(prefix?: string): ReadonlyArray<string> {
  return defineComponents({
    ...(prefix !== undefined ? { prefix } : {}),
    components: { 'mth-payment-form': MthPaymentForm },
  });
}
