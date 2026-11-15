import { UIElement, type PropertyValues } from '@methane-ui/core';
import { isSafeUrl } from '@methane-ui/sanitize';
import { registerMthButton } from '@methane-ui/ui/button';
import { html, nothing } from 'lit';
import { property } from 'lit/decorators.js';
import { cartMessages } from './cart.messages.js';
import { cartStyles } from './cart.styles.js';

export interface CartItem {
  readonly id: string;
  readonly title: string;
  readonly variant?: string;
  readonly price: number;
  readonly quantity: number;
  readonly min?: number;
  readonly max?: number;
  readonly image?: string;
  readonly href?: string;
}

/**
 * `<mth-cart>`: accessible shopping cart composing `mth-quantity-selector`, `mth-price-display`,
 * and `@methane-ui/ui/button` with sanitized thumbnails/links and locale-aware currency totals.
 */
export class MthCart extends UIElement {
  static override messages = cartMessages;
  static override styles = cartStyles;

  @property({ attribute: false })
  items: ReadonlyArray<CartItem> = [];

  @property({ type: String })
  currency = 'USD';

  @property({ type: String })
  locale = '';

  @property({ type: Number, attribute: 'tax-rate' })
  taxRate = 0;

  @property({ type: Number, attribute: 'shipping-amount' })
  shippingAmount = 0;

  @property({ type: Number, attribute: 'discount-amount' })
  discountAmount = 0;

  @property({ type: Boolean, attribute: 'allow-remove' })
  allowRemove = true;

  @property({ type: Boolean, reflect: true })
  disabled = false;

  @property({ type: String, attribute: 'checkout-label' })
  checkoutLabel = '';

  constructor() {
    super();
    registerMthButton();
  }

  private get subtotal(): number {
    return (this.items ?? []).reduce((sum, item) => {
      const price = Number.isFinite(item.price) ? item.price : 0;
      const qty = Number.isFinite(item.quantity) ? Math.max(0, item.quantity) : 0;
      return sum + price * qty;
    }, 0);
  }

  private get effectiveDiscount(): number {
    const raw = Number.isFinite(this.discountAmount) ? Math.max(0, this.discountAmount) : 0;
    return Math.min(this.subtotal, raw);
  }

  private get taxAmount(): number {
    const rate = Number.isFinite(this.taxRate) ? Math.max(0, this.taxRate) : 0;
    return Math.max(0, this.subtotal - this.effectiveDiscount) * rate;
  }

  private get safeShipping(): number {
    return Number.isFinite(this.shippingAmount) ? Math.max(0, this.shippingAmount) : 0;
  }

  private get total(): number {
    return Math.max(0, this.subtotal - this.effectiveDiscount + this.taxAmount + this.safeShipping);
  }

  private formatMoney(value: number): string {
    const targetLocale = this.locale || this.resolvedLocale;
    const safe = Number.isFinite(value) ? value : 0;
    try {
      return new Intl.NumberFormat(targetLocale, {
        style: 'currency',
        currency: this.currency || 'USD',
      }).format(safe);
    } catch {
      return `${this.currency || 'USD'} ${safe.toFixed(2)}`;
    }
  }

  protected override willUpdate(changed: PropertyValues<this>): void {
    super.willUpdate(changed);
    this.setCustomState('empty', (this.items ?? []).length === 0);
    this.setCustomState('disabled', this.disabled);
  }

  protected override render() {
    const list = this.items ?? [];

    return html`
      <section class="root" part="base" dir=${this.resolvedDir} aria-label=${this.t('regionLabel')}>
        <slot name="header"></slot>

        ${list.length === 0
          ? html`<div class="empty"><slot name="empty">${this.t('emptyTitle')}</slot></div>`
          : html`
              <ul class="items" part="items">
                ${list.map((item) => {
                  const safeImg = item.image && isSafeUrl(item.image) ? item.image : '';
                  const safeHref = item.href && isSafeUrl(item.href) ? item.href : '';
                  const qty = Number.isFinite(item.quantity) ? Math.max(0, item.quantity) : 1;
                  const lineAmount = (Number.isFinite(item.price) ? item.price : 0) * qty;

                  return html`
                    <li class="item" part="item">
                      <div class="item-info">
                        ${safeImg
                          ? html`<img class="thumb" src=${safeImg} alt=${item.title} loading="lazy" />`
                          : nothing}
                        <div class="meta">
                          ${safeHref
                            ? html`<a class="title" href=${safeHref}>${item.title}</a>`
                            : html`<span class="title">${item.title}</span>`}
                          ${item.variant ? html`<span class="variant">${item.variant}</span>` : nothing}
                        </div>
                      </div>

                      <div class="controls">
                        <div class="qty-group" role="group" aria-label=${item.title}>
                          <button
                            type="button"
                            class="qty-btn"
                            aria-label=${this.t('decreaseLabel', { title: item.title })}
                            ?disabled=${this.disabled || qty <= (item.min ?? 1)}
                            @click=${() =>
                              this.emitEvent('mth-quantity-change', {
                                detail: { id: item.id, quantity: Math.max(item.min ?? 1, qty - 1) },
                              })}
                          >
                            -
                          </button>
                          <span class="variant">${qty}</span>
                          <button
                            type="button"
                            class="qty-btn"
                            aria-label=${this.t('increaseLabel', { title: item.title })}
                            ?disabled=${this.disabled || qty >= (item.max ?? 99)}
                            @click=${() =>
                              this.emitEvent('mth-quantity-change', {
                                detail: { id: item.id, quantity: Math.min(item.max ?? 99, qty + 1) },
                              })}
                          >
                            +
                          </button>
                        </div>

                        <span class="title">${this.formatMoney(lineAmount)}</span>

                        ${this.allowRemove
                          ? html`
                              <button
                                type="button"
                                class="remove-btn"
                                aria-label=${this.t('removeLabel', { title: item.title })}
                                ?disabled=${this.disabled}
                                @click=${() => this.emitEvent('mth-remove-item', { detail: { id: item.id } })}
                              >
                                &times;
                              </button>
                            `
                          : nothing}
                      </div>
                    </li>
                  `;
                })}
              </ul>

              <div class="summary" part="summary">
                <div class="row">
                  <span>${this.t('subtotalLabel')}</span>
                  <span>${this.formatMoney(this.subtotal)}</span>
                </div>
                ${this.effectiveDiscount > 0
                  ? html`
                      <div class="row">
                        <span>${this.t('discountLabel')}</span>
                        <span>-${this.formatMoney(this.effectiveDiscount)}</span>
                      </div>
                    `
                  : nothing}
                ${this.safeShipping > 0
                  ? html`
                      <div class="row">
                        <span>${this.t('shippingLabel')}</span>
                        <span>${this.formatMoney(this.safeShipping)}</span>
                      </div>
                    `
                  : nothing}
                ${this.taxAmount > 0
                  ? html`
                      <div class="row">
                        <span>${this.t('taxLabel')}</span>
                        <span>${this.formatMoney(this.taxAmount)}</span>
                      </div>
                    `
                  : nothing}
                <div class="row total-row">
                  <span>${this.t('totalLabel')}</span>
                  <span>${this.formatMoney(this.total)}</span>
                </div>
              </div>

              <mth-button
                part="checkout-button"
                variant="primary"
                ?disabled=${this.disabled}
                @click=${() =>
                  this.emitEvent('mth-checkout', {
                    detail: {
                      items: list,
                      subtotal: this.subtotal,
                      total: this.total,
                    },
                  })}
              >
                ${this.checkoutLabel || this.t('checkoutLabel')}
              </mth-button>
            `}

        <slot name="footer"></slot>
      </section>
    `;
  }
}
