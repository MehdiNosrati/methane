import { getRuntime } from '@methane-ui/core';
import { MthInvoice } from './element.js';

export { MthInvoice, type InvoiceItem, type InvoiceParty } from './element.js';
export { invoiceMessages } from './invoice.messages.js';
export { invoiceSpec } from './invoice.spec.js';

export function registerMthInvoice(prefix = 'mth'): ReadonlyArray<string> {
  return getRuntime().registry.defineComponents({
    prefix,
    components: {
      'mth-invoice': MthInvoice,
    },
  });
}

registerMthInvoice();
