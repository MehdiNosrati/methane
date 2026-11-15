import { getRuntime } from '@methane/core';
import { MthPaymentForm } from './element.js';

export { MthPaymentForm } from './element.js';
export { paymentFormMessages } from './payment-form.messages.js';
export { paymentFormSpec } from './payment-form.spec.js';

export function registerMthPaymentForm(prefix = 'mth'): ReadonlyArray<string> {
  return getRuntime().registry.defineComponents({
    prefix,
    components: {
      'mth-payment-form': MthPaymentForm,
    },
  });
}

registerMthPaymentForm();
