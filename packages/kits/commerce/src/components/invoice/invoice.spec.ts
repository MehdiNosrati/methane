import type { ComponentBehaviorSpec } from '@methane/spec-compiler';
import { invoiceMessages } from './invoice.messages.js';

export const invoiceSpec: ComponentBehaviorSpec = {
  tag: 'mth-invoice',
  package: '@methane/commerce',
  conformance: [],
  controllers: [],
  focusModel: 'none',
  states: ['paid', 'overdue'],
  keyboard: [],
  props: [
    { name: 'invoiceNumber', attr: 'invoice-number', type: 'string', default: '' },
    { name: 'issueDate', attr: 'issue-date', type: 'string', default: '' },
    { name: 'dueDate', attr: 'due-date', type: 'string', default: '' },
    { name: 'status', attr: 'status', type: "'paid' | 'pending' | 'overdue' | 'draft'", default: 'pending' },
    { name: 'currency', attr: 'currency', type: 'string', default: 'USD' },
    { name: 'locale', attr: 'locale', type: 'string', default: '' },
    { name: 'seller', attr: false, type: 'InvoiceParty | null' },
    { name: 'buyer', attr: false, type: 'InvoiceParty | null' },
    { name: 'items', attr: false, type: 'ReadonlyArray<InvoiceItem>' },
    { name: 'taxRate', attr: 'tax-rate', type: 'number', default: 0 },
    { name: 'discountAmount', attr: 'discount-amount', type: 'number', default: 0 },
    { name: 'notes', attr: 'notes', type: 'string', default: '' },
    { name: 'logoUrl', attr: 'logo-url', type: 'string', default: '' },
  ],
  events: [],
  slots: [{ name: 'footer', description: 'Optional footer terms or payment link.' }],
  parts: [
    { name: 'base', description: 'Outer invoice document surface.' },
    { name: 'header', description: 'Top invoice metadata header.' },
    { name: 'parties', description: 'Seller and buyer address grid.' },
    { name: 'table', description: 'Line items table.' },
    { name: 'totals', description: 'Subtotal, discount, tax, and total summary.' },
  ],
  messages: { ...invoiceMessages },
};

export const CEM_METADATA = {
  description:
    'Print-friendly structured invoice view with localized Intl.NumberFormat line totals, sanitized brand logo URL, and status badge.',
  propDescriptions: {
    invoiceNumber: 'Invoice identifier string.',
    issueDate: 'Formatted or ISO issue date.',
    dueDate: 'Formatted or ISO payment due date.',
    status: 'Payment status: paid, pending, overdue, or draft.',
    currency: 'ISO 4217 currency code for Intl.NumberFormat.',
    locale: 'Optional BCP 47 locale override; defaults to UIElement resolvedLocale.',
    seller: 'Seller contact and billing address metadata.',
    buyer: 'Buyer contact and billing address metadata.',
    items: 'Invoice line items with description, quantity, and unitPrice.',
    taxRate: 'Fractional tax rate applied after discount.',
    discountAmount: 'Flat discount subtracted before tax.',
    notes: 'Optional memo or payment instructions.',
    logoUrl: 'Optional brand logo URL validated via @methane/sanitize.',
  },
  cssProperties: [
    { name: '--mth-color-surface', description: 'Invoice document background.' },
    { name: '--mth-color-border', description: 'Invoice section and table border color.' },
    { name: '--mth-color-fg-muted', description: 'Muted header and address label color.' },
  ],
};
