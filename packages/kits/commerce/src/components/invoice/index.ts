import { registerMthInvoice } from './element.js';

export * from './element.js';

registerMthInvoice();

declare global {
  interface HTMLElementTagNameMap {
    'mth-invoice': import('./invoice.js').MthInvoice;
  }
}
