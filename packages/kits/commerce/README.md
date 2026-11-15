# `@methane/commerce`

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

E-commerce, SaaS billing, checkout, pricing, and storefront Web Components for **Methane UI** — locale-aware `Intl.NumberFormat` currency formatting, credit-card Luhn validation, interactive cart totals, facet filters, and invoice rendering.

## Installation

```bash
pnpm add @methane/commerce @methane/core @methane/tokens
# or
npm install @methane/commerce @methane/core @methane/tokens
```

> **Peer dependency:** `@methane/core` (`^0.1.0 || ^1.0.0`) is required.

## Package Exports

| Entrypoint | Description |
| --- | --- |
| `@methane/commerce` | Auto-registers all 10 commerce kit elements and exports `registerAllComponents(prefix?)` |
| `@methane/commerce/<slug>` | Per-component entrypoint (e.g. `@methane/commerce/cart`, `@methane/commerce/price-display`) |
| `@methane/commerce/<slug>/element` | Unregistered component class, spec, styles, messages, and `registerMth*()` |
| `@methane/commerce/custom-elements.json` | Custom Elements Manifest (CEM) |

## Exported Components

| Tag | Class | Key Props / Attributes | Custom Events |
| --- | --- | --- | --- |
| `<mth-product-card>` | `MthProductCard` | `title`, `subtitle`, `image-src`, `price`, `compare-at-price`, `currency`, `locale`, `badge`, `rating`, `review-count`, `in-stock` | `mth-add-to-cart`, `mth-product-select` |
| `<mth-price-display>` | `MthPriceDisplay` | `amount`, `compare-at-amount`, `currency`, `locale`, `period`, `show-discount-badge` | — |
| `<mth-quantity-selector>` | `MthQuantitySelector` | `value`, `min`, `max`, `step`, `name`, `label`, `disabled`, `required` | `mth-input`, `mth-change` |
| `<mth-cart>` | `MthCart` | `currency`, `locale`, `tax-rate`, `shipping-amount`, `discount-amount`, `allow-remove`, `checkout-label`, `.items` | `mth-quantity-change`, `mth-remove-item`, `mth-checkout` |
| `<mth-checkout-steps>` | `MthCheckoutSteps` | `active-step`, `orientation`, `linear`, `label`, `.steps` | `mth-step-change`, `mth-step-complete` |
| `<mth-payment-form>` | `MthPaymentForm` | `value`, `name`, `amount`, `currency`, `locale`, `submit-label`, `disabled`, `required` | `mth-change`, `mth-submit` |
| `<mth-plan-picker>` | `MthPlanPicker` | `value`, `billing-cycle`, `currency`, `locale`, `name`, `label`, `disabled`, `required`, `.plans` | `mth-change`, `mth-cycle-change` |
| `<mth-facet-filters>` | `MthFacetFilters` | `collapsible`, `label`, `.groups` | `mth-filter-change`, `mth-filter-clear` |
| `<mth-review-summary>` | `MthReviewSummary` | `average`, `total-reviews`, `active-star`, `max-stars`, `label`, `.breakdown` | `mth-rating-filter` |
| `<mth-invoice>` | `MthInvoice` | `invoice-number`, `issue-date`, `due-date`, `status`, `currency`, `locale`, `tax-rate`, `discount-amount`, `logo-url` | — |

## Usage Examples

```html
<mth-product-card
  title="Pro Studio Monitor"
  price="499"
  compare-at-price="599"
  currency="USD"
  rating="4.8"
  review-count="124"
  in-stock
></mth-product-card>

<mth-price-display amount="29" compare-at-amount="39" currency="EUR" period="/mo" show-discount-badge></mth-price-display>
```

```ts
import '@methane/tokens/tokens.css';
import '@methane/commerce/product-card';
import '@methane/commerce/price-display';

document.querySelector('mth-product-card')?.addEventListener('mth-add-to-cart', (ev) => {
  console.log('Added item:', (ev as CustomEvent).detail);
});
```

## Theming, A11y & SSR Notes

- **Theming**: Exposes `::part(base)`, `::part(price)`, `::part(action)`, `::part(summary)`, `::part(checkout-button)`, and `--mth-*` semantic tokens.
- **Accessibility & Forms**: `<mth-payment-form>`, `<mth-quantity-selector>`, and `<mth-plan-picker>` implement FACE form participation and constraint validation; URL attributes (`logo-url`, `image-src`, `href`) are protocol-validated via `@methane/sanitize`.
- **SSR**: Zero browser-only dependencies on initial render, making product cards, price displays, and invoices straightforward to SSR with `@methane/ssr`.

## License

MIT © [Methane UI](https://mahdins.dev/methane/)
