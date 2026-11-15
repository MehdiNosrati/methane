import { UIElement, type PropertyValues } from '@methane/core';
import {
  FormControlController,
  FormattingUtils,
  InputController,
  MaskAndFormatEngine,
} from '@methane/primitives';
import { html, nothing } from 'lit';
import { property, query, state } from 'lit/decorators.js';
import { ifDefined } from 'lit/directives/if-defined.js';
import { currencyInputMessages } from './currency-input.messages.js';
import { currencyInputStyles } from './currency-input.styles.js';

interface LocaleCurrencyMetadata {
  symbol: string;
  groupSeparator: string;
  decimalSeparator: string;
}

function resolveCurrencyMetadata(locale: string, currency: string): LocaleCurrencyMetadata {
  try {
    const parts = new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      currencyDisplay: 'narrowSymbol',
    }).formatToParts(12345.6);
    const symbol = parts.find((p) => p.type === 'currency')?.value ?? currency;
    const groupSeparator = parts.find((p) => p.type === 'group')?.value ?? ',';
    const decimalSeparator = parts.find((p) => p.type === 'decimal')?.value ?? '.';
    return { symbol, groupSeparator, decimalSeparator };
  } catch {
    return { symbol: currency || '$', groupSeparator: ',', decimalSeparator: '.' };
  }
}

/**
 * `<mth-currency-input>`: form-associated locale-aware monetary input using
 * `Intl.NumberFormat`, `FormattingUtils`, and `MaskAndFormatEngine`.
 */
export class MthCurrencyInput extends UIElement {
  static formAssociated = true;
  static override shadowRootOptions = { mode: 'open' as const, delegatesFocus: true };
  static override messages = currencyInputMessages;
  static override styles = currencyInputStyles;

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
  placeholder = '';

  @property({ type: String })
  currency = 'USD';

  @property({ type: String })
  locale = 'en-US';

  @property({ type: Number })
  decimals = 2;

  @property({ type: Boolean, attribute: 'allow-negative', reflect: true })
  allowNegative = false;

  @property({ type: Number })
  min: number | undefined = undefined;

  @property({ type: Number })
  max: number | undefined = undefined;

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

  @query('#mth-currency-control')
  private controlEl!: HTMLInputElement | null;

  private readonly formCtrl: FormControlController;
  private readonly inputCtrl: InputController;
  private readonly maskEngine: MaskAndFormatEngine;

  constructor() {
    super();
    this.maskEngine = new MaskAndFormatEngine(
      {
        mode: 'numeric',
        locale: this.locale,
        decimals: this.decimals,
        allowNegative: this.allowNegative,
        groupSeparator: ',',
        decimalSeparator: '.',
      },
      null,
    );

    this.formCtrl = new FormControlController(this, {
      internals: this.internals,
      defaultValue: '',
      messages: currencyInputMessages,
      onValueSync: (nextValue, source) => {
        const changed = this.value !== nextValue;
        this.value = nextValue;
        this.syncDisplayValue(nextValue);
        if (source === 'autofill' && changed) {
          this.emitEvent('mth-input', {
            detail: {
              value: nextValue,
              valueAsNumber: this.parseNumeric(nextValue),
              currency: this.currency,
            },
          });
        }
      },
      onDisabledChange: () => {
        this.requestUpdate();
      },
      onSetCustomState: (stateName, active) => {
        this.setCustomState(stateName, active);
      },
      validator: ({ value }) => {
        const str = typeof value === 'string' ? value.trim() : '';
        if (this.error.length > 0) {
          return { flags: { customError: true }, message: this.error };
        }
        if (str.length === 0) return null;
        const num = Number(str);
        if (!Number.isFinite(num)) {
          return { flags: { badInput: true }, message: this.t('invalidAmount') };
        }
        if (this.min !== undefined && Number.isFinite(this.min) && num < this.min) {
          return {
            flags: { rangeUnderflow: true },
            message: this.t('rangeUnderflow', {
              min: FormattingUtils.formatCurrency(this.min, this.currency, this.locale),
            }),
          };
        }
        if (this.max !== undefined && Number.isFinite(this.max) && num > this.max) {
          return {
            flags: { rangeOverflow: true },
            message: this.t('rangeOverflow', {
              max: FormattingUtils.formatCurrency(this.max, this.currency, this.locale),
            }),
          };
        }
        return null;
      },
    });

    this.inputCtrl = new InputController(this, {
      onCommitValue: (nextValue) => {
        this.applyUserInput(nextValue);
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

  get valueAsNumber(): number {
    return this.parseNumeric(this.value);
  }

  get formattedValue(): string {
    const num = this.valueAsNumber;
    if (!Number.isFinite(num)) return '';
    return FormattingUtils.formatCurrency(num, this.currency, this.locale);
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
    if (
      changedProperties.has('locale') ||
      changedProperties.has('currency') ||
      changedProperties.has('decimals') ||
      changedProperties.has('allowNegative')
    ) {
      const meta = resolveCurrencyMetadata(this.locale, this.currency);
      this.maskEngine.setConfig({
        mode: 'numeric',
        locale: this.locale,
        decimals: this.decimals,
        allowNegative: this.allowNegative,
        groupSeparator: meta.groupSeparator,
        decimalSeparator: meta.decimalSeparator,
      });
    }
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
      this.syncDisplayValue(this.value);
    }
    if (
      changedProperties.has('error') ||
      changedProperties.has('min') ||
      changedProperties.has('max')
    ) {
      this.formCtrl.validate();
    }

    this.setCustomState('required', this.formCtrl.required);
    this.setCustomState('readonly', this.formCtrl.readOnly);
  }

  protected override updated(changedProperties: PropertyValues): void {
    super.updated(changedProperties);
    if (this.controlEl) {
      this.inputCtrl.bind(this.controlEl);
      this.syncDisplayValue(this.value);
    }
  }

  private parseNumeric(raw: string): number {
    const trimmed = raw.trim();
    if (trimmed.length === 0 || trimmed === '-') return Number.NaN;
    const n = Number(trimmed);
    return Number.isFinite(n) ? n : Number.NaN;
  }

  private formatForDisplay(rawCanonical: string): string {
    if (rawCanonical.length === 0) return '';
    const { decimalSeparator } = resolveCurrencyMetadata(this.locale, this.currency);
    const localizedRaw =
      decimalSeparator === '.' ? rawCanonical : rawCanonical.replace('.', decimalSeparator);
    return this.maskEngine.format(localizedRaw).formatted;
  }

  private syncDisplayValue(rawValue: string): void {
    if (!this.controlEl) return;
    const display = this.formatForDisplay(rawValue);
    if (this.controlEl.value !== display) {
      this.controlEl.value = display;
    }
  }

  private applyUserInput(rawInput: string): void {
    const res = this.controlEl
      ? this.maskEngine.applyInput(this.controlEl)
      : this.maskEngine.format(rawInput);
    this.value = res.unmasked;
    this.formCtrl.setValue(res.unmasked, { markDirty: true });
    this.emitEvent('mth-input', {
      detail: {
        value: res.unmasked,
        valueAsNumber: this.parseNumeric(res.unmasked),
        currency: this.currency,
      },
    });
  }

  private readonly handleNativeChange = (): void => {
    if (this.controlEl) {
      const res = this.maskEngine.format(this.controlEl.value);
      if (this.value !== res.unmasked) {
        this.value = res.unmasked;
        this.formCtrl.setValue(res.unmasked, { markDirty: true });
      }
      this.syncDisplayValue(this.value);
    }
    this.emitEvent('mth-change', {
      detail: {
        value: this.value,
        valueAsNumber: this.parseNumeric(this.value),
        currency: this.currency,
      },
    });
  };

  private readonly handleNativeBlur = (): void => {
    this.formCtrl.markTouched();
    if (this.value.length > 0 && this.decimals > 0) {
      const num = this.parseNumeric(this.value);
      if (Number.isFinite(num)) {
        const fixed = num.toFixed(this.decimals);
        this.syncDisplayValue(fixed);
      }
    }
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
    const meta = resolveCurrencyMetadata(this.locale, this.currency);
    const displayValue = this.formatForDisplay(this.value);

    return html`
      <div part="base" class="base">
        <label
          id="mth-currency-label"
          for="mth-currency-control"
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
          <span part="currency" class="currency" aria-hidden="true">${meta.symbol}</span>
          <input
            id="mth-currency-control"
            part="control"
            class="control"
            type="text"
            inputmode="decimal"
            .value=${displayValue}
            name=${ifDefined(this.name || undefined)}
            placeholder=${ifDefined(this.placeholder || undefined)}
            aria-label=${!hasLabel ? `${this.t('defaultLabel')} (${this.currency})` : nothing}
            ?disabled=${isDisabled}
            ?required=${isRequired}
            ?readonly=${isReadonly}
            aria-invalid=${isInvalid ? 'true' : 'false'}
            aria-describedby=${hasHint && !hasError ? 'mth-currency-hint' : nothing}
            aria-errormessage=${isInvalid && hasError ? 'mth-currency-error' : nothing}
            @change=${this.handleNativeChange}
            @blur=${this.handleNativeBlur}
            @keydown=${this.handleNativeKeydown}
          />
          <slot name="suffix"></slot>
        </div>
        <p
          id="mth-currency-hint"
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
          id="mth-currency-error"
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
