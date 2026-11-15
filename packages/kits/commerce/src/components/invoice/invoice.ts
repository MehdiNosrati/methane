import { UIElement, type PropertyValues } from '@methane-ui/core';
import { isSafeUrl } from '@methane-ui/sanitize';
import { registerMthBadge } from '@methane-ui/ui/badge';
import { html, nothing } from 'lit';
import { property } from 'lit/decorators.js';
import { invoiceMessages } from './invoice.messages.js';
import { invoiceStyles } from './invoice.styles.js';

export interface InvoiceParty {
  readonly name: string;
  readonly lines?: ReadonlyArray<string>;
  readonly email?: string;
}

export interface InvoiceItem {
  readonly description: string;
  readonly quantity: number;
  readonly unitPrice: number;
}

/**
 * `<mth-invoice>`: structured print-friendly invoice display with localized `Intl.NumberFormat`
 * currency formatting, status badge, and `@methane-ui/sanitize` logo URL validation.
 */
export class MthInvoice extends UIElement {
  static override messages = invoiceMessages;
  static override styles = invoiceStyles;

  @property({ type: String, attribute: 'invoice-number' })
  invoiceNumber = '';

  @property({ type: String, attribute: 'issue-date' })
  issueDate = '';

  @property({ type: String, attribute: 'due-date' })
  dueDate = '';

  @property({ type: String })
  status: 'paid' | 'pending' | 'overdue' | 'draft' = 'pending';

  @property({ type: String })
  currency = 'USD';

  @property({ type: String })
  locale = '';

  @property({ attribute: false })
  seller: InvoiceParty | null = null;

  @property({ attribute: false })
  buyer: InvoiceParty | null = null;

  @property({ attribute: false })
  items: ReadonlyArray<InvoiceItem> = [];

  @property({ type: Number, attribute: 'tax-rate' })
  taxRate = 0;

  @property({ type: Number, attribute: 'discount-amount' })
  discountAmount = 0;

  @property({ type: String })
  notes = '';

  @property({ type: String, attribute: 'logo-url' })
  logoUrl = '';

  constructor() {
    super();
    registerMthBadge();
  }

  private get subtotal(): number {
    return (this.items ?? []).reduce((sum, item) => {
      const qty = Number.isFinite(item.quantity) ? Math.max(0, item.quantity) : 0;
      const unit = Number.isFinite(item.unitPrice) ? item.unitPrice : 0;
      return sum + qty * unit;
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

  private get total(): number {
    return Math.max(0, this.subtotal - this.effectiveDiscount + this.taxAmount);
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

  private get statusBadge(): { label: string; variant: 'success' | 'warning' | 'danger' | 'neutral' } {
    switch (this.status) {
      case 'paid':
        return { label: this.t('statusPaid'), variant: 'success' };
      case 'overdue':
        return { label: this.t('statusOverdue'), variant: 'danger' };
      case 'draft':
        return { label: this.t('statusDraft'), variant: 'neutral' };
      default:
        return { label: this.t('statusPending'), variant: 'warning' };
    }
  }

  protected override willUpdate(changed: PropertyValues<this>): void {
    super.willUpdate(changed);
    this.setCustomState('paid', this.status === 'paid');
    this.setCustomState('overdue', this.status === 'overdue');
  }

  protected override render() {
    const safeLogo = this.logoUrl && isSafeUrl(this.logoUrl) ? this.logoUrl : '';
    const badge = this.statusBadge;
    const rows = this.items ?? [];

    return html`
      <article class="root" part="base" dir=${this.resolvedDir} aria-label=${this.t('regionLabel')}>
        <header class="header" part="header">
          <div class="brand">
            ${safeLogo ? html`<img class="logo" src=${safeLogo} alt=${this.seller?.name ?? ''} />` : nothing}
            <div>
              <h2 class="title">
                ${this.t('invoiceHeading')}${this.invoiceNumber ? ` #${this.invoiceNumber}` : ''}
              </h2>
              <mth-badge size="sm" variant=${badge.variant}>${badge.label}</mth-badge>
            </div>
          </div>

          <div class="meta">
            ${this.issueDate ? html`<span>${this.t('issuedLabel')}: ${this.issueDate}</span>` : nothing}
            ${this.dueDate ? html`<span>${this.t('dueLabel')}: ${this.dueDate}</span>` : nothing}
          </div>
        </header>

        ${this.seller || this.buyer
          ? html`
              <div class="parties" part="parties">
                ${this.seller
                  ? html`
                      <address class="party">
                        <span class="party-label">${this.t('fromLabel')}</span>
                        <strong>${this.seller.name}</strong>
                        ${(this.seller.lines ?? []).map((line) => html`<span>${line}</span>`)}
                        ${this.seller.email ? html`<span>${this.seller.email}</span>` : nothing}
                      </address>
                    `
                  : nothing}
                ${this.buyer
                  ? html`
                      <address class="party">
                        <span class="party-label">${this.t('billToLabel')}</span>
                        <strong>${this.buyer.name}</strong>
                        ${(this.buyer.lines ?? []).map((line) => html`<span>${line}</span>`)}
                        ${this.buyer.email ? html`<span>${this.buyer.email}</span>` : nothing}
                      </address>
                    `
                  : nothing}
              </div>
            `
          : nothing}

        <table class="table" part="table" aria-label=${this.t('invoiceHeading')}>
          <thead>
            <tr>
              <th scope="col">${this.t('descriptionCol')}</th>
              <th scope="col" class="num">${this.t('quantityCol')}</th>
              <th scope="col" class="num">${this.t('unitPriceCol')}</th>
              <th scope="col" class="num">${this.t('amountCol')}</th>
            </tr>
          </thead>
          <tbody>
            ${rows.map((item) => {
              const qty = Number.isFinite(item.quantity) ? Math.max(0, item.quantity) : 0;
              const unit = Number.isFinite(item.unitPrice) ? item.unitPrice : 0;
              return html`
                <tr>
                  <td>${item.description}</td>
                  <td class="num">${qty}</td>
                  <td class="num">${this.formatMoney(unit)}</td>
                  <td class="num">${this.formatMoney(qty * unit)}</td>
                </tr>
              `;
            })}
          </tbody>
        </table>

        <div class="totals" part="totals">
          <div class="total-row">
            <span>${this.t('subtotalLabel')}</span>
            <span>${this.formatMoney(this.subtotal)}</span>
          </div>
          ${this.effectiveDiscount > 0
            ? html`
                <div class="total-row">
                  <span>${this.t('discountLabel')}</span>
                  <span>-${this.formatMoney(this.effectiveDiscount)}</span>
                </div>
              `
            : nothing}
          ${this.taxAmount > 0
            ? html`
                <div class="total-row">
                  <span>${this.t('taxLabel')}</span>
                  <span>${this.formatMoney(this.taxAmount)}</span>
                </div>
              `
            : nothing}
          <div class="total-row grand-total">
            <span>${this.t('totalLabel')}</span>
            <span>${this.formatMoney(this.total)}</span>
          </div>
        </div>

        ${this.notes ? html`<p class="notes">${this.notes}</p>` : nothing}
        <slot name="footer"></slot>
      </article>
    `;
  }
}
