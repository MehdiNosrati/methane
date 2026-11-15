import type { ComponentBehaviorSpec } from '@methane-ui/spec-compiler';
import { priceDisplayMessages } from './price-display.messages.js';

export const priceDisplaySpec: ComponentBehaviorSpec = {
  tag: 'mth-price-display',
  package: '@methane-ui/commerce',
  conformance: [],
  controllers: [],
  focusModel: 'none',
  states: ['on-sale', 'free'],
  keyboard: [],
  props: [
    { name: 'amount', attr: 'amount', type: 'number', default: 0 },
    { name: 'compareAtAmount', attr: 'compare-at-amount', type: 'number | null', default: null },
    { name: 'currency', attr: 'currency', type: 'string', default: 'USD' },
    { name: 'locale', attr: 'locale', type: 'string', default: '' },
    { name: 'period', attr: 'period', type: 'string', default: '' },
    { name: 'showDiscountBadge', attr: 'show-discount-badge', type: 'boolean', default: true },
  ],
  events: [],
  slots: [{ name: 'period', description: 'Optional custom billing cadence suffix.' }],
  parts: [
    { name: 'base', description: 'Root price wrapper.' },
    { name: 'current', description: 'Formatted active price.' },
    { name: 'period', description: 'Optional billing cadence suffix.' },
    { name: 'compare-at', description: 'Strikethrough original price when on sale.' },
    { name: 'discount', description: 'Percentage discount badge when on sale.' },
  ],
  messages: { ...priceDisplayMessages },
};

export const CEM_METADATA = {
  description:
    'Locale-aware currency price formatter supporting compare-at pricing, discount badges, and billing cadence.',
  propDescriptions: {
    amount: 'Numeric monetary amount.',
    compareAtAmount: 'Optional original price shown struck through when higher than amount.',
    currency: 'ISO 4217 currency code passed to Intl.NumberFormat.',
    locale: 'Optional BCP 47 locale override; defaults to UIElement resolvedLocale.',
    period: 'Optional recurring billing period suffix (e.g., `/mo`).',
    showDiscountBadge: 'Displays percentage savings badge when compareAtAmount exceeds amount.',
  },
  cssProperties: [
    { name: '--mth-color-fg', description: 'Active price foreground color.' },
    { name: '--mth-color-fg-subtle', description: 'Compare-at strikethrough price color.' },
    { name: '--mth-color-success', description: 'On-sale price highlight color.' },
  ],
};
