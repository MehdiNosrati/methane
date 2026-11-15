import { UIElement, type PropertyValues } from '@methane/core';
import { FormControlController, InputController, MaskAndFormatEngine } from '@methane/primitives';
import { html, nothing } from 'lit';
import { property, query, state } from 'lit/decorators.js';
import { ifDefined } from 'lit/directives/if-defined.js';
import { phoneInputMessages } from './phone-input.messages.js';
import { phoneInputStyles } from './phone-input.styles.js';

export interface PhoneCountryOption {
  readonly code: string;
  readonly dialCode: string;
  readonly mask: string;
}

export const PHONE_COUNTRIES: ReadonlyArray<PhoneCountryOption> = [
  { code: 'US', dialCode: '+1', mask: '(000) 000-0000' },
  { code: 'CA', dialCode: '+1', mask: '(000) 000-0000' },
  { code: 'GB', dialCode: '+44', mask: '0000 000000' },
  { code: 'DE', dialCode: '+49', mask: '0000 0000000' },
  { code: 'FR', dialCode: '+33', mask: '0 00 00 00 00' },
  { code: 'JP', dialCode: '+81', mask: '00-0000-0000' },
  { code: 'AU', dialCode: '+61', mask: '000 000 000' },
  { code: 'IN', dialCode: '+91', mask: '00000 00000' },
  { code: 'BR', dialCode: '+55', mask: '(00) 00000-0000' },
  { code: 'MX', dialCode: '+52', mask: '00 0000 0000' },
];

/**
 * `<mth-phone-input>`: form-associated international telephone input with country
 * dial prefix selector and pattern masking via `MaskAndFormatEngine`.
 */
export class MthPhoneInput extends UIElement {
  static formAssociated = true;
  static override shadowRootOptions = { mode: 'open' as const, delegatesFocus: true };
  static override messages = phoneInputMessages;
  static override styles = phoneInputStyles;

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
  placeholder = '(555) 123-4567';

  @property({ type: String })
  autocomplete = 'tel-national';

  @property({ type: String, reflect: true })
  country = 'US';

  @property({ type: String, attribute: 'dial-code', reflect: true })
  dialCode = '+1';

  @property({ type: String })
  mask = '(000) 000-0000';

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

  @query('#mth-phone-control')
  private controlEl!: HTMLInputElement | null;

  private readonly formCtrl: FormControlController;
  private readonly inputCtrl: InputController;
  private readonly maskEngine: MaskAndFormatEngine;
  private prevControlValue = '';

  constructor() {
    super();
    this.maskEngine = new MaskAndFormatEngine(
      {
        mode: 'pattern',
        pattern: this.mask,
        definitions: { '#': /\d/ },
      },
      null,
    );

    this.formCtrl = new FormControlController(this, {
      internals: this.internals,
      defaultValue: '',
      messages: phoneInputMessages,
      onValueSync: (nextValue, source) => {
        const formatted = nextValue.length > 0 ? this.maskEngine.format(nextValue).formatted : '';
        const changed = this.value !== formatted;
        this.value = formatted;
        this.prevControlValue = formatted;
        if (this.controlEl && this.controlEl.value !== formatted) {
          this.controlEl.value = formatted;
        }
        if (source === 'autofill' && changed) {
          this.emitEvent('mth-input', { detail: this.buildDetail(formatted) });
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
        if (str.length > 0 && !this.maskEngine.format(str).isComplete) {
          return { flags: { patternMismatch: true }, message: this.t('incompletePhone') };
        }
        return null;
      },
    });

    this.inputCtrl = new InputController(this, {
      onCommitValue: () => {
        this.applyMaskedInput();
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

  get unmaskedValue(): string {
    return this.maskEngine.format(this.value).unmasked;
  }

  get e164(): string {
    const digits = this.unmaskedValue;
    return digits.length > 0 ? `${this.dialCode}${digits}` : '';
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
    this.prevControlValue = '';
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
    if (changedProperties.has('mask')) {
      this.maskEngine.setConfig({
        mode: 'pattern',
        pattern: this.mask,
        definitions: { '#': /\d/ },
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
      this.prevControlValue = this.value;
      if (this.controlEl && this.controlEl.value !== this.value) {
        this.controlEl.value = this.value;
      }
    }
    if (changedProperties.has('error') || changedProperties.has('mask')) {
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

  private buildDetail(formatted: string): {
    value: string;
    unmasked: string;
    dialCode: string;
    e164: string;
  } {
    const unmasked = this.maskEngine.format(formatted).unmasked;
    return {
      value: formatted,
      unmasked,
      dialCode: this.dialCode,
      e164: unmasked.length > 0 ? `${this.dialCode}${unmasked}` : '',
    };
  }

  private applyMaskedInput(): void {
    if (!this.controlEl) return;
    const res = this.maskEngine.applyInput(this.controlEl, this.prevControlValue);
    this.prevControlValue = res.formatted;
    this.value = res.formatted;
    this.formCtrl.setValue(res.formatted, { markDirty: true });
    this.emitEvent('mth-input', { detail: this.buildDetail(res.formatted) });
  }

  private readonly handleCountryChange = (event: Event): void => {
    if (this.formCtrl.disabled || this.formCtrl.readOnly) return;
    const select = event.target as HTMLSelectElement;
    const option = PHONE_COUNTRIES.find((c) => c.code === select.value);
    if (!option) return;
    this.country = option.code;
    this.dialCode = option.dialCode;
    this.mask = option.mask;
    this.emitEvent('mth-country-change', {
      detail: { country: this.country, dialCode: this.dialCode },
    });
  };

  private readonly handleNativeChange = (event: Event): void => {
    const target = event.target as HTMLInputElement;
    const res = this.maskEngine.format(target.value);
    if (this.value !== res.formatted) {
      this.value = res.formatted;
      this.prevControlValue = res.formatted;
      this.formCtrl.setValue(res.formatted, { markDirty: true });
    }
    this.emitEvent('mth-change', { detail: this.buildDetail(this.value) });
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

    return html`
      <div part="base" class="base">
        <label
          id="mth-phone-label"
          for="mth-phone-control"
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
          <select
            part="country"
            class="country"
            aria-label=${this.t('countryCodeLabel')}
            .value=${this.country}
            ?disabled=${isDisabled || isReadonly}
            @change=${this.handleCountryChange}
          >
            ${PHONE_COUNTRIES.map(
              (c) => html`<option value=${c.code} ?selected=${c.code === this.country}>${c.code} ${c.dialCode}</option>`,
            )}
          </select>
          <input
            id="mth-phone-control"
            part="control"
            class="control"
            type="tel"
            inputmode="tel"
            .value=${this.value}
            name=${ifDefined(this.name || undefined)}
            placeholder=${ifDefined(this.placeholder || undefined)}
            autocomplete=${ifDefined(this.autocomplete || undefined)}
            aria-label=${!hasLabel ? this.t('defaultLabel') : nothing}
            ?disabled=${isDisabled}
            ?required=${isRequired}
            ?readonly=${isReadonly}
            aria-invalid=${isInvalid ? 'true' : 'false'}
            aria-describedby=${hasHint && !hasError ? 'mth-phone-hint' : nothing}
            aria-errormessage=${isInvalid && hasError ? 'mth-phone-error' : nothing}
            @change=${this.handleNativeChange}
            @blur=${this.handleNativeBlur}
            @keydown=${this.handleNativeKeydown}
          />
          <slot name="suffix"></slot>
        </div>
        <p
          id="mth-phone-hint"
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
          id="mth-phone-error"
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
