import { registerMthPaymentForm } from './element.js';

export * from './element.js';

registerMthPaymentForm();

declare global {
  interface HTMLElementTagNameMap {
    'mth-payment-form': import('./payment-form.js').MthPaymentForm;
  }
}
