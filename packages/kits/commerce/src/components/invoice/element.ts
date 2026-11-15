import { defineComponents } from '@methane-ui/core';
import { MthInvoice } from './invoice.js';

export { MthInvoice, type InvoiceItem, type InvoiceParty } from './invoice.js';
export { invoiceMessages } from './invoice.messages.js';

export function registerMthInvoice(prefix?: string): ReadonlyArray<string> {
  return defineComponents({
    ...(prefix !== undefined ? { prefix } : {}),
    components: { 'mth-invoice': MthInvoice },
  });
}
