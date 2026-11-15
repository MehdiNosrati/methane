import { UIElement, type PropertyValues } from '@methane/core';
import {
  FormControlController,
  InputController,
  MaskAndFormatEngine,
  validateLuhn,
} from '@methane/primitives';
import { registerMthButton } from '@methane/ui/button';
import { html, nothing } from 'lit';
import { property, query, state } from 'lit/decorators.js';
import { live } from 'lit/directives/live.js';
import { paymentFormMessages } from './payment-form.messages.js';
import { paymentFormStyles } from './payment-form.styles.js';

function isValidExpiry(raw: string): boolean {
  const match = /^(\d{2})\/(\d{2})$/.exec(raw.trim());
  if (!match) return false;
  const month = Number(match[1]);
  return month >= 1 && month <= 12;
}

/**
 * `<mth-payment-form>`: form-associated payment form powered by `FormControlController`,
 * `MaskAndFormatEngine({ mode: 'card' })`, and `validateLuhn` with proper `cc-*` autocomplete
 * hints and tokenized non-PAN `mth-submit` payload.
 */
export class MthPaymentForm extends UIElement {
  static formAssociated = true;
  static override messages = paymentFormMessages;
  static override styles = paymentFormStyles;

  @property({ type: String })
  value = '';

  @property({ type: String, reflect: true })
  name = '';

  @property({ type: Number })
  amount = 0;

  @property({ type: String })
  currency = 'USD';

  @property({ type: String })
  locale = '';

  @property({ type: String, attribute: 'submit-label' })
  submitLabel = '';

  @property({ type: Boolean, reflect: true })
  disabled = false;

  @property({ type: Boolean, reflect: true })
  required = false;

  @state()
  private cardDisplay = '';

  @state()
  private cardDigits = '';

  @state()
  private expiry = '';

  @state()
  private cvc = '';

  @state()
  private validationError = '';

  @query('#cc-name')
  private nameInputEl!: HTMLInputElement | null;

  private initializedDefault = false;
  private boundInputEl: HTMLInputElement | null = null;
  private readonly formCtrl: FormControlController;
  private readonly inputCtrl: InputController;
  private readonly cardMask: MaskAndFormatEngine;

  constructor() {
    super();
    registerMthButton();
    this.cardMask = new MaskAndFormatEngine({ mode: 'card' }, this);
    this.inputCtrl = new InputController(this, {
      onCommitValue: (committed) => {
        if (this.inputCtrl.element?.id === 'cc-name') {
          this.value = committed;
          this.formCtrl.markTouched();
          this.formCtrl.setValue(this.value, { markDirty: true });
          this.emitChange();
        }
      },
    });
    this.formCtrl = new FormControlController(this, {
      internals: this.internals,
      defaultValue: '',
      onValueSync: (val, source) => {
        this.value = val;
        if (source === 'reset') {
          this.cardDisplay = '';
          this.cardDigits = '';
          this.expiry = '';
          this.cvc = '';
          this.validationError = '';
        }
      },
      onDisabledChange: () => {
        this.syncStates();
        this.requestUpdate();
      },
      onSetCustomState: (name, active) => {
        this.setCustomState(name, active);
      },
    });
  }

  override connectedCallback(): void {
    super.connectedCallback();
    if (!this.initializedDefault) {
      this.initializedDefault = true;
      this.formCtrl.setDefaultValue(this.value);
      this.formCtrl.setValue(this.value, { markDirty: false });
    }
  }

  override formDisabledCallback(disabled: boolean): void {
    super.formDisabledCallback(disabled);
    this.formCtrl.handleFormDisabled(disabled);
  }

  override formResetCallback(): void {
    super.formResetCallback();
    this.formCtrl.handleFormReset();
  }

  override formStateRestoreCallback(
    state: File | string | FormData | null,
    mode: 'restore' | 'autocomplete',
  ): void {
    super.formStateRestoreCallback(state, mode);
    this.formCtrl.handleFormStateRestore(state, mode);
  }

  get effectivelyDisabled(): boolean {
    return this.formCtrl.disabled;
  }

  private get effectiveDisabled(): boolean {
    return this.formCtrl.disabled;
  }

  get isCardValid(): boolean {
    return (
      this.value.trim().length > 0 &&
      this.cardDigits.length >= 13 &&
      validateLuhn(this.cardDigits) &&
      isValidExpiry(this.expiry) &&
      /^\d{3,4}$/.test(this.cvc.trim())
    );
  }

  private formatCta(): string {
    if (this.submitLabel) return this.submitLabel;
    if (!Number.isFinite(this.amount) || this.amount <= 0) return this.t('submitLabel');
    const targetLocale = this.locale || this.resolvedLocale;
    try {
      const formatted = new Intl.NumberFormat(targetLocale, {
        style: 'currency',
        currency: this.currency || 'USD',
      }).format(this.amount);
      return `${this.t('submitLabel')} (${formatted})`;
    } catch {
      return this.t('submitLabel');
    }
  }

  private handleNameInput = (e: Event): void => {
    if (this.inputCtrl.isComposing) return;
    this.value = (e.target as HTMLInputElement).value;
    this.formCtrl.markTouched();
    this.formCtrl.setValue(this.value, { markDirty: true });
    this.emitChange();
  };

  private handleCardInput = (e: Event): void => {
    if (this.inputCtrl.isComposing) return;
    const raw = (e.target as HTMLInputElement).value;
    const result = this.cardMask.format(raw);
    this.cardDisplay = result.formatted;
    this.cardDigits = result.unmasked.replace(/\D/g, '');
    this.emitChange();
  };

  private handleExpiryInput = (e: Event): void => {
    if (this.inputCtrl.isComposing) return;
    const digits = (e.target as HTMLInputElement).value.replace(/\D/g, '').slice(0, 4);
    this.expiry = digits.length > 2 ? `${digits.slice(0, 2)}/${digits.slice(2)}` : digits;
    this.emitChange();
  };

  private handleCvcInput = (e: Event): void => {
    if (this.inputCtrl.isComposing) return;
    this.cvc = (e.target as HTMLInputElement).value.replace(/\D/g, '').slice(0, 4);
    this.emitChange();
  };

  private handleInputFocusIn = (e: FocusEvent): void => {
    const target = e.target;
    if (target instanceof HTMLInputElement && this.boundInputEl !== target) {
      this.boundInputEl = target;
      this.inputCtrl.bind(target);
    }
  };

  private emitChange(): void {
    const last4 = this.cardDigits.slice(-4);
    this.emitEvent('mth-change', {
      detail: {
        cardholderName: this.value,
        last4,
        valid: this.isCardValid,
      },
    });
  }

  private validateFields(): string {
    if (!this.value.trim()) return this.t('invalidNameError');
    if (this.cardDigits.length < 13 || !validateLuhn(this.cardDigits)) {
      return this.t('invalidCardError');
    }
    if (!isValidExpiry(this.expiry)) return this.t('invalidExpiryError');
    if (!/^\d{3,4}$/.test(this.cvc.trim())) return this.t('invalidCvcError');
    return '';
  }

  submitPayment(): boolean {
    if (this.effectiveDisabled) return false;
    const error = this.validateFields();
    this.validationError = error;
    this.syncStates();
    if (error) {
      return false;
    }
    this.emitEvent('mth-submit', {
      detail: {
        cardholderName: this.value.trim(),
        last4: this.cardDigits.slice(-4),
        expiry: this.expiry,
        valid: true,
      },
    });
    return true;
  }

  private handleFormSubmit = (e: Event): void => {
    e.preventDefault();
    this.submitPayment();
  };

  private syncStates(): void {
    this.setCustomState('disabled', this.effectiveDisabled);
    this.setCustomState('invalid', Boolean(this.validationError));
  }

  protected override willUpdate(changed: PropertyValues<this>): void {
    super.willUpdate(changed);
    if (changed.has('value') || changed.has('disabled') || changed.has('required')) {
      this.formCtrl.hostDisabled = this.disabled;
      this.formCtrl.required = this.required;
      this.formCtrl.setValue(this.value, { markDirty: false });
      this.syncStates();
    }
  }

  protected override updated(changed: PropertyValues<this>): void {
    super.updated(changed);
    if (this.nameInputEl && !this.boundInputEl) {
      this.boundInputEl = this.nameInputEl;
      this.inputCtrl.bind(this.nameInputEl);
    }
  }

  override disconnectedCallback(): void {
    this.boundInputEl = null;
    super.disconnectedCallback();
  }

  protected override render() {
    const isDisabled = this.effectiveDisabled;
    const hasError = Boolean(this.validationError);
    const errorId = 'mth-pf-error';

    return html`
      <form
        class="form"
        part="base"
        dir=${this.resolvedDir}
        aria-label=${this.t('regionLabel')}
        novalidate
        @focusin=${this.handleInputFocusIn}
        @submit=${this.handleFormSubmit}
      >
        <div class="field">
          <label class="label" for="cc-name">${this.t('cardholderLabel')}</label>
          <input
            id="cc-name"
            class="input"
            part="name-input"
            type="text"
            autocomplete="cc-name"
            .value=${live(this.value)}
            ?disabled=${isDisabled}
            ?required=${this.required}
            aria-invalid=${hasError && !this.value.trim() ? 'true' : 'false'}
            aria-describedby=${hasError ? errorId : nothing}
            @input=${this.handleNameInput}
          />
        </div>

        <div class="field">
          <label class="label" for="cc-number">${this.t('cardNumberLabel')}</label>
          <input
            id="cc-number"
            class="input"
            part="number-input"
            type="text"
            inputmode="numeric"
            autocomplete="cc-number"
            .value=${live(this.cardDisplay)}
            ?disabled=${isDisabled}
            aria-invalid=${hasError && (this.cardDigits.length < 13 || !validateLuhn(this.cardDigits)) ? 'true' : 'false'}
            aria-describedby=${hasError ? errorId : nothing}
            @input=${this.handleCardInput}
          />
        </div>

        <div class="row">
          <div class="field">
            <label class="label" for="cc-exp">${this.t('expiryLabel')}</label>
            <input
              id="cc-exp"
              class="input"
              part="expiry-input"
              type="text"
              inputmode="numeric"
              autocomplete="cc-exp"
              placeholder="MM/YY"
              .value=${live(this.expiry)}
              ?disabled=${isDisabled}
              aria-invalid=${hasError && !isValidExpiry(this.expiry) ? 'true' : 'false'}
              aria-describedby=${hasError ? errorId : nothing}
              @input=${this.handleExpiryInput}
            />
          </div>

          <div class="field">
            <label class="label" for="cc-csc">${this.t('cvcLabel')}</label>
            <input
              id="cc-csc"
              class="input"
              part="cvc-input"
              type="text"
              inputmode="numeric"
              autocomplete="cc-csc"
              .value=${live(this.cvc)}
              ?disabled=${isDisabled}
              aria-invalid=${hasError && !/^\d{3,4}$/.test(this.cvc.trim()) ? 'true' : 'false'}
              aria-describedby=${hasError ? errorId : nothing}
              @input=${this.handleCvcInput}
            />
          </div>
        </div>

        ${hasError
          ? html`<p id=${errorId} class="error" part="error" role="alert">${this.validationError}</p>`
          : nothing}

        <mth-button
          part="submit-button"
          type="button"
          variant="primary"
          ?disabled=${isDisabled}
          @click=${() => this.submitPayment()}
        >
          ${this.formatCta()}
        </mth-button>

        <slot name="footer"></slot>
      </form>
    `;
  }
}
