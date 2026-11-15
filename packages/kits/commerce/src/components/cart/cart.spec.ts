import type { ComponentBehaviorSpec } from '@methane/spec-compiler';
import { cartMessages } from './cart.messages.js';

export const cartSpec: ComponentBehaviorSpec = {
  tag: 'mth-cart',
  package: '@methane/commerce',
  conformance: [],
  controllers: [],
  focusModel: 'none',
  states: ['empty', 'disabled'],
  keyboard: [],
  props: [
    { name: 'items', attr: false, type: 'ReadonlyArray<CartItem>' },
    { name: 'currency', attr: 'currency', type: 'string', default: 'USD' },
    { name: 'locale', attr: 'locale', type: 'string', default: '' },
    { name: 'taxRate', attr: 'tax-rate', type: 'number', default: 0 },
    { name: 'shippingAmount', attr: 'shipping-amount', type: 'number', default: 0 },
    { name: 'discountAmount', attr: 'discount-amount', type: 'number', default: 0 },
    { name: 'allowRemove', attr: 'allow-remove', type: 'boolean', default: true },
    { name: 'disabled', attr: 'disabled', type: 'boolean', default: false },
    { name: 'checkoutLabel', attr: 'checkout-label', type: 'string', default: '' },
  ],
  events: [
    {
      name: 'mth-quantity-change',
      cancelable: false,
      detailType: '{ id: string; quantity: number }',
    },
    {
      name: 'mth-remove-item',
      cancelable: false,
      detailType: '{ id: string }',
    },
    {
      name: 'mth-checkout',
      cancelable: false,
      detailType: '{ items: ReadonlyArray<CartItem>; subtotal: number; total: number }',
    },
  ],
  slots: [
    { name: 'header', description: 'Optional header slot above cart items.' },
    { name: 'empty', description: 'Custom empty-cart callout.' },
    { name: 'footer', description: 'Additional footer content below checkout button.' },
  ],
  parts: [
    { name: 'base', description: 'Root cart section container.' },
    { name: 'items', description: 'Line items list.' },
    { name: 'item', description: 'Individual cart line item.' },
    { name: 'summary', description: 'Price totals breakdown.' },
    { name: 'checkout-button', description: 'Primary checkout button.' },
  ],
  messages: { ...cartMessages },
};

export const CEM_METADATA = {
  description:
    'Accessible shopping cart line-item list with quantity adjustments, item removal, URL sanitization, and localized currency breakdown.',
  propDescriptions: {
    items: 'Array of CartItem entries in the cart.',
    currency: 'ISO 4217 currency code used by Intl.NumberFormat.',
    locale: 'Optional BCP 47 locale override; defaults to UIElement resolvedLocale.',
    taxRate: 'Fractional tax rate applied to discounted subtotal (e.g., 0.08).',
    shippingAmount: 'Flat shipping amount added to total.',
    discountAmount: 'Flat discount subtracted from subtotal before tax.',
    allowRemove: 'Shows item removal controls when true.',
    disabled: 'Disables interactive quantity, remove, and checkout actions.',
    checkoutLabel: 'Overrides localized checkout CTA label.',
  },
  cssProperties: [
    { name: '--mth-color-surface', description: 'Cart card surface background.' },
    { name: '--mth-color-border', description: 'Line item divider border color.' },
    { name: '--mth-color-fg-muted', description: 'Secondary item metadata text color.' },
  ],
};
