import type { ComponentBehaviorSpec } from '@methane-ui/spec-compiler';
import { productCardMessages } from './product-card.messages.js';

export const productCardSpec: ComponentBehaviorSpec = {
  tag: 'mth-product-card',
  package: '@methane-ui/commerce',
  conformance: [],
  controllers: [],
  focusModel: 'delegates-focus',
  states: ['out-of-stock', 'on-sale'],
  keyboard: [],
  props: [
    { name: 'title', attr: 'title', type: 'string', default: '' },
    { name: 'subtitle', attr: 'subtitle', type: 'string', default: '' },
    { name: 'imageSrc', attr: 'image-src', type: 'string', default: '' },
    { name: 'imageAlt', attr: 'image-alt', type: 'string', default: '' },
    { name: 'href', attr: 'href', type: 'string', default: '' },
    { name: 'price', attr: 'price', type: 'number | null', default: null },
    { name: 'compareAtPrice', attr: 'compare-at-price', type: 'number | null', default: null },
    { name: 'currency', attr: 'currency', type: 'string', default: 'USD' },
    { name: 'locale', attr: 'locale', type: 'string', default: '' },
    { name: 'badge', attr: 'badge', type: 'string', default: '' },
    { name: 'rating', attr: 'rating', type: 'number | null', default: null },
    { name: 'reviewCount', attr: 'review-count', type: 'number | null', default: null },
    { name: 'inStock', attr: 'in-stock', type: 'boolean', default: true },
    { name: 'actionLabel', attr: 'action-label', type: 'string', default: '' },
  ],
  events: [
    {
      name: 'mth-add-to-cart',
      cancelable: false,
      detailType: '{ title: string; price: number | null; currency: string }',
    },
    {
      name: 'mth-product-select',
      cancelable: false,
      detailType: '{ title: string; href: string }',
    },
  ],
  slots: [
    { name: 'media', description: 'Optional custom media overriding default product image.' },
    { name: 'badge', description: 'Optional badge overlay content.' },
    { name: 'footer', description: 'Optional extra footer controls.' },
  ],
  parts: [
    { name: 'base', description: 'Root product card article container.' },
    { name: 'media', description: 'Aspect-ratio product media frame.' },
    { name: 'image', description: 'Sanitized product image element.' },
    { name: 'badge', description: 'Promotional or availability badge.' },
    { name: 'title', description: 'Product title heading or link.' },
    { name: 'subtitle', description: 'Optional secondary subtitle text.' },
    { name: 'rating', description: 'Accessible star rating summary.' },
    { name: 'price', description: 'Formatted active and compare-at price row.' },
    { name: 'action', description: 'Primary add-to-cart button.' },
  ],
  messages: { ...productCardMessages },
};

export const CEM_METADATA = {
  description:
    'E-commerce product card with sanitized media/link URLs, locale-aware currency pricing, accessible rating summary, and quick-add action.',
  propDescriptions: {
    title: 'Product display title.',
    subtitle: 'Optional secondary product descriptor.',
    imageSrc: 'Product image URL validated via `@methane-ui/sanitize` `isSafeUrl`.',
    imageAlt: 'Alternative text for product image.',
    href: 'Optional product detail link validated via `isSafeUrl`.',
    price: 'Current unit price in `currency`.',
    compareAtPrice: 'Optional original strikethrough price.',
    currency: 'ISO 4217 currency code.',
    locale: 'Optional BCP 47 locale override for Intl.NumberFormat.',
    badge: 'Optional promotional badge text.',
    rating: 'Optional numeric star rating (0–5).',
    reviewCount: 'Optional total review count shown alongside rating.',
    inStock: 'Whether the product is purchasable.',
    actionLabel: 'Custom CTA label overriding localized Add to cart text.',
  },
  eventDescriptions: {
    'mth-add-to-cart': 'Fired when the user clicks the Add to cart button.',
    'mth-product-select': 'Fired when the user activates the product link/title.',
  },
  cssProperties: [
    { name: '--mth-color-surface', description: 'Card background surface color.' },
    { name: '--mth-color-border', description: 'Card border color.' },
    { name: '--mth-radius-lg', description: 'Card outer corner radius.' },
  ],
};
