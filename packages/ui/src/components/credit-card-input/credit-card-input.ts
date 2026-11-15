import { UIElement, type PropertyValues } from '@methane-ui/core';
import {
  FormControlController,
  InputController,
  MaskAndFormatEngine,
  validateLuhn,
} from '@methane-ui/primitives';
import { html, nothing } from 'lit';
import { property, query, state } from 'lit/decorators.js';
import { ifDefined } from 'lit/directives/if-defined.js';
import { creditCardInputMessages } from './credit-card-input.messages.js';
import { creditCardInputStyles } from './credit-card-input.styles.js';

export type CardBrand = 'visa' | 'mastercard' | 'amex' | 'discover' | 'unknown';

/**
 * Infers payment card network from IIN/BIN digit prefixes without logging raw PANs.
 */
export function detectCardBrand(rawDigits: string): CardBrand {
  const digits = rawDigits.replace(/\D/g, '');
  if (/^4/.test(digits)) return 'visa';
  if (/^(5[1-5]|2(2[2-9]|[3-6]\d|7[01]|720))/.test(digits)) return 'mastercard';
  if (/^3[47]/.test(digits)) return 'amex';
  if (/^(6011|65|64[4-9])/.test(digits)) return 'discover';
  return 'unknown';
}

/**
 * `<mth-credit-card-input>`: form-associated payment card input with BIN brand
 * detection, grouping via `MaskAndFormatEngine`, and Luhn checksum validation.
 */
export class MthCreditCardInput extends UIElement {
  static formAssociated = true;
  static override shadowRootOptions = { mode: 'open' as const, delegatesFocus: true };
  static override messages = creditCardInputMessages;
  static override styles = creditCardInputStyles;

  @property({ type: String })
  value = '';

  @property({ type: String, reflect: true })
  name = '';

  @property({ type: String })
  label = '';

  @property({ type: String })
  hint = '';

  @property({ type: String })
  error = '';

  @property({ type: String })
  placeholder = '•••• •••• •••• ••••';

  @property({ type: String })
  autocomplete = 'cc-number';

  @property({ type: Boolean, reflect: true })
  disabled = false;

  @property({ type: Boolean, reflect: true })
  required = false;

  @property({ type: Boolean, reflect: true })
  readonly = false;

  @state()
  private slottedLabelText = '';

  @state()
  private slottedHintText = '';

  @state()
  private slottedErrorText = '';

  @query('#mth-cc-control')
  private controlEl!: HTMLInputElement | null;

  private readonly formCtrl: FormControlController;
  private readonly inputCtrl: InputController;
  private readonly maskEngine: MaskAndFormatEngine;

  constructor() {
    super();
    this.maskEngine = new MaskAndFormatEngine({ mode: 'card' }, null);

    this.formCtrl = new FormControlController(this, {
      internals: this.internals,
      defaultValue: '',
      messages: creditCardInputMessages,
      onValueSync: (nextValue, source) => {
        const res = nextValue.length > 0 ? this.maskEngine.format(nextValue) : null;
        const formatted = res ? res.formatted : '';
        const changed = this.value !== formatted;
        this.value = formatted;
        if (this.controlEl && this.controlEl.value !== formatted) {
          this.controlEl.value = formatted;
        }
        if (source === 'autofill' && changed) {
          this.emitEvent('mth-input', { detail: this.buildEventDetail(formatted) });
        }
      },
      onDisabledChange: () => {
        this.requestUpdate();
      },
      onSetCustomState: (stateName, active) => {
        this.setCustomState(stateName, active);
      },
      validator: ({ value }) => {
        const str = typeof value === 'string' ? value : '';
        if (this.error.length > 0) {
          return { flags: { customError: true }, message: this.error };
        }
        const digits = str.replace(/\D/g, '');
        if (digits.length > 0) {
          const res = this.maskEngine.format(digits);
          if (!res.isComplete || !validateLuhn(digits)) {
            return { flags: { patternMismatch: true }, message: this.t('invalidCard') };
          }
        }
        return null;
      },
    });

    this.inputCtrl = new InputController(this, {
      onCommitValue: () => {
        this.applyCardInput();
      },
    });
  }

  get validity(): ValidityState | undefined {
    return this.internals?.validity;
  }

  get validityFlags() {
    return this.formCtrl.validityFlags;
  }

  get validationMessage(): string {
    return this.formCtrl.validationMessage || this.internals?.validationMessage || '';
  }

  get form(): HTMLFormElement | null {
    return this.internals?.form ?? this.closest('form');
  }

  get dirty(): boolean {
    return this.formCtrl.dirty;
  }

  get touched(): boolean {
    return this.formCtrl.touched;
  }

  get effectivelyDisabled(): boolean {
    return this.formCtrl.disabled;
  }

  get brand(): CardBrand {
    return detectCardBrand(this.value);
  }

  get unmaskedValue(): string {
    return this.value.replace(/\D/g, '');
  }

  override focus(options?: FocusOptions): void {
    this.controlEl?.focus(options);
  }

  checkValidity(): boolean {
    return this.formCtrl.checkValidity();
  }

  reportValidity(): boolean {
    return this.formCtrl.reportValidity();
  }

  protected override onFirstConnect(): void {
    const initialDefault = this.getAttribute('value') ?? this.value ?? '';
    this.formCtrl.setDefaultValue(initialDefault);
    this.formCtrl.setValue(this.value, { markDirty: false });
  }

  protected override onFormDisabled(disabled: boolean): void {
    this.formCtrl.handleFormDisabled(disabled);
  }

  protected override onFormReset(): void {
    this.formCtrl.handleFormReset();
  }

  protected override onFormStateRestore(
    stateValue: File | string | FormData | null,
    mode: 'restore' | 'autocomplete',
  ): void {
    this.formCtrl.handleFormStateRestore(stateValue, mode);
  }

  protected override willUpdate(changedProperties: PropertyValues): void {
    super.willUpdate(changedProperties);
    if (changedProperties.has('disabled')) {
      this.formCtrl.hostDisabled = this.disabled;
    }
    if (changedProperties.has('required')) {
      this.formCtrl.required = this.required;
    }
    if (changedProperties.has('readonly')) {
      this.formCtrl.hostReadOnly = this.readonly;
    }
    if (changedProperties.has('value')) {
      if (this.formCtrl.value !== this.value) {
        this.formCtrl.setValue(this.value, { markDirty: false });
      }
      if (this.controlEl && this.controlEl.value !== this.value) {
        this.controlEl.value = this.value;
      }
    }
    if (changedProperties.has('error')) {
      this.formCtrl.validate();
    }

    this.setCustomState('required', this.formCtrl.required);
    this.setCustomState('readonly', this.formCtrl.readOnly);
  }

  protected override updated(changedProperties: PropertyValues): void {
    super.updated(changedProperties);
    if (this.controlEl) {
      this.inputCtrl.bind(this.controlEl);
      if (this.controlEl.value !== this.value) {
        this.controlEl.value = this.value;
      }
    }
  }

  private buildEventDetail(formatted: string): {
    brand: CardBrand;
    valid: boolean;
    complete: boolean;
  } {
    const digits = formatted.replace(/\D/g, '');
    const res = this.maskEngine.format(digits);
    return {
      brand: detectCardBrand(digits),
      valid: res.isComplete && validateLuhn(digits),
      complete: res.isComplete,
    };
  }

  private applyCardInput(): void {
    if (!this.controlEl) return;
    const res = this.maskEngine.applyInput(this.controlEl);
    this.value = res.formatted;
    this.formCtrl.setValue(res.formatted, { markDirty: true });
    this.emitEvent('mth-input', { detail: this.buildEventDetail(res.formatted) });
  }

  private readonly handleNativeChange = (event: Event): void => {
    const target = event.target as HTMLInputElement;
    const res = target.value.length > 0 ? this.maskEngine.format(target.value) : null;
    const formatted = res ? res.formatted : '';
    if (this.value !== formatted) {
      this.value = formatted;
      this.formCtrl.setValue(formatted, { markDirty: true });
    }
    this.emitEvent('mth-change', { detail: this.buildEventDetail(this.value) });
  };

  private readonly handleNativeBlur = (): void => {
    this.formCtrl.markTouched();
  };

  private readonly handleNativeKeydown = (event: KeyboardEvent): void => {
    if (event.key === 'Enter' && !event.defaultPrevented && !this.inputCtrl.isComposing) {
      const owningForm = this.form;
      if (owningForm) {
        if (typeof owningForm.requestSubmit === 'function') {
          owningForm.requestSubmit();
        } else {
          owningForm.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
        }
      }
    }
  };

  private resolveBrandLabel(brand: CardBrand): string {
    switch (brand) {
      case 'visa':
        return this.t('brandVisa');
      case 'mastercard':
        return this.t('brandMastercard');
      case 'amex':
        return this.t('brandAmex');
      case 'discover':
        return this.t('brandDiscover');
      case 'unknown':
        return this.t('brandUnknown');
    }
  }

  private handleTextSlotChange(slotName: 'label' | 'hint' | 'error', event: Event): void {
    const slot = event.target as HTMLSlotElement;
    const text = slot
      .assignedNodes({ flatten: true })
      .map((node) => node.textContent ?? '')
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim();

    if (slotName === 'label') {
      this.slottedLabelText = text;
    } else if (slotName === 'hint') {
      this.slottedHintText = text;
    } else {
      this.slottedErrorText = text;
    }
  }

  override render() {
    const ctx = this.formCtrl.fieldContext;
    const hasFieldContext = Boolean(ctx);
    const effectiveLabel = this.slottedLabelText || this.label || ctx?.label || '';
    const effectiveHint = this.slottedHintText || this.hint || ctx?.hint || '';
    const explicitError = this.slottedErrorText || this.error || ctx?.error || '';
    const validityError = this.formCtrl.userInvalid ? this.formCtrl.validationMessage : '';
    const effectiveError = explicitError || validityError;

    const hasLabel = effectiveLabel.length > 0;
    const hasHint = effectiveHint.length > 0;
    const hasError = effectiveError.length > 0;
    const isRequired = this.formCtrl.required;
    const isDisabled = this.formCtrl.disabled;
    const isReadonly = this.formCtrl.readOnly;
    const isInvalid = this.formCtrl.userInvalid || explicitError.length > 0;
    const currentBrand = this.brand;

    return html`
      <div part="base" class="base">
        <label
          id="mth-cc-label"
          for="mth-cc-control"
          part="label"
          class=${hasFieldContext ? 'label sr-only' : 'label'}
          ?hidden=${!hasLabel}
        >
          <slot
            name="label"
            @slotchange=${(ev: Event) => this.handleTextSlotChange('label', ev)}
          >${effectiveLabel}</slot>
          ${isRequired && !hasFieldContext
            ? html`<span class="required-mark" aria-hidden="true">${this.t('requiredIndicator')}</span>`
            : nothing}
        </label>
        <div part="wrapper" class="wrapper" data-invalid=${isInvalid ? 'true' : 'false'}>
          <input
            id="mth-cc-control"
            part="control"
            class="control"
            type="text"
            inputmode="numeric"
            .value=${this.value}
            name=${ifDefined(this.name || undefined)}
            placeholder=${ifDefined(this.placeholder || undefined)}
            autocomplete=${ifDefined(this.autocomplete || undefined)}
            aria-label=${!hasLabel ? this.t('defaultLabel') : nothing}
            ?disabled=${isDisabled}
            ?required=${isRequired}
            ?readonly=${isReadonly}
            aria-invalid=${isInvalid ? 'true' : 'false'}
            aria-describedby=${hasHint && !hasError ? 'mth-cc-hint' : nothing}
            aria-errormessage=${isInvalid && hasError ? 'mth-cc-error' : nothing}
            @change=${this.handleNativeChange}
            @blur=${this.handleNativeBlur}
            @keydown=${this.handleNativeKeydown}
          />
          <span part="brand" class="brand" data-brand=${currentBrand}>
            ${this.resolveBrandLabel(currentBrand)}
          </span>
        </div>
        <p
          id="mth-cc-hint"
          part="hint"
          class=${hasFieldContext ? 'hint sr-only' : 'hint'}
          ?hidden=${!hasHint || hasError}
        >
          <slot
            name="hint"
            @slotchange=${(ev: Event) => this.handleTextSlotChange('hint', ev)}
          >${effectiveHint}</slot>
        </p>
        <p
          id="mth-cc-error"
          part="error"
          class=${hasFieldContext ? 'error sr-only' : 'error'}
          role=${hasError ? 'alert' : nothing}
          ?hidden=${!hasError}
        >
          <slot
            name="error"
            @slotchange=${(ev: Event) => this.handleTextSlotChange('error', ev)}
          >${effectiveError}</slot>
        </p>
      </div>
    `;
  }
}
