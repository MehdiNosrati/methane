import { UIElement, type PropertyValues } from '@methane/core';
import { FormControlController, InputController } from '@methane/primitives';
import { html, nothing } from 'lit';
import { property, query, state } from 'lit/decorators.js';
import { addressInputMessages } from './address-input.messages.js';
import { addressInputStyles } from './address-input.styles.js';

export interface AddressValue {
  street: string;
  street2?: string;
  city: string;
  region: string;
  postalCode: string;
  country: string;
}

const EMPTY_ADDRESS: AddressValue = {
  street: '',
  street2: '',
  city: '',
  region: '',
  postalCode: '',
  country: '',
};

function parseAddressValue(raw: string): AddressValue {
  if (!raw || raw.trim().length === 0) {
    return { ...EMPTY_ADDRESS };
  }
  try {
    const parsed = JSON.parse(raw) as Partial<AddressValue>;
    if (parsed && typeof parsed === 'object') {
      return {
        street: typeof parsed.street === 'string' ? parsed.street : '',
        street2: typeof parsed.street2 === 'string' ? parsed.street2 : '',
        city: typeof parsed.city === 'string' ? parsed.city : '',
        region: typeof parsed.region === 'string' ? parsed.region : '',
        postalCode: typeof parsed.postalCode === 'string' ? parsed.postalCode : '',
        country: typeof parsed.country === 'string' ? parsed.country : '',
      };
    }
  } catch {
    // Non-JSON string falls back to street line so plain string FormControlSuite tests also work.
  }
  return { ...EMPTY_ADDRESS, street: raw };
}

function serializeAddressValue(addr: AddressValue): string {
  const hasAny =
    addr.street.trim().length > 0 ||
    (addr.street2 ?? '').trim().length > 0 ||
    addr.city.trim().length > 0 ||
    addr.region.trim().length > 0 ||
    addr.postalCode.trim().length > 0 ||
    addr.country.trim().length > 0;
  if (!hasAny) return '';
  return JSON.stringify({
    street: addr.street,
    ...(addr.street2 ? { street2: addr.street2 } : {}),
    city: addr.city,
    region: addr.region,
    postalCode: addr.postalCode,
    country: addr.country,
  });
}

/**
 * `<mth-address-input>`: form-associated structured postal address input with
 * autocomplete tokens, composite JSON serialization, and same-root ARIA.
 */
export class MthAddressInput extends UIElement {
  static formAssociated = true;
  static override shadowRootOptions = { mode: 'open' as const, delegatesFocus: true };
  static override messages = addressInputMessages;
  static override styles = addressInputStyles;

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

  @property({ type: Boolean, attribute: 'include-line2', reflect: true })
  includeLine2 = false;

  @property({ type: Boolean, reflect: true })
  disabled = false;

  @property({ type: Boolean, reflect: true })
  required = false;

  @property({ type: Boolean, reflect: true })
  readonly = false;

  @state()
  private fields: AddressValue = { ...EMPTY_ADDRESS };

  @state()
  private slottedLabelText = '';

  @state()
  private slottedHintText = '';

  @state()
  private slottedErrorText = '';

  @query('#mth-addr-street')
  private streetEl!: HTMLInputElement | null;

  private readonly formCtrl: FormControlController;
  private readonly inputCtrl: InputController;

  constructor() {
    super();
    this.formCtrl = new FormControlController(this, {
      internals: this.internals,
      defaultValue: '',
      messages: addressInputMessages,
      onValueSync: (nextValue, source) => {
        this.value = nextValue;
        this.fields = parseAddressValue(nextValue);
        if (source === 'autofill') {
          this.emitEvent('mth-input', {
            detail: { value: nextValue, address: { ...this.fields } },
          });
        }
      },
      onDisabledChange: () => {
        this.requestUpdate();
      },
      onSetCustomState: (stateName, active) => {
        this.setCustomState(stateName, active);
      },
      validator: ({ required, value }) => {
        if (this.error.length > 0) {
          return { flags: { customError: true }, message: this.error };
        }
        const str = typeof value === 'string' ? value : '';
        if (required && str.length > 0) {
          const parsed = parseAddressValue(str);
          if (
            !parsed.street.trim() ||
            !parsed.city.trim() ||
            !parsed.postalCode.trim() ||
            !parsed.country.trim()
          ) {
            return { flags: { customError: true }, message: this.t('incompleteAddress') };
          }
        }
        return null;
      },
    });

    this.inputCtrl = new InputController(this, {
      onCommitValue: () => {
        // Subfield handlers update composite value directly.
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

  get address(): AddressValue {
    return { ...this.fields };
  }

  set address(next: AddressValue) {
    this.fields = { ...EMPTY_ADDRESS, ...next };
    this.value = serializeAddressValue(this.fields);
  }

  override focus(options?: FocusOptions): void {
    this.streetEl?.focus(options);
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
    this.fields = parseAddressValue(this.value);
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
      this.fields = parseAddressValue(this.value);
      if (this.formCtrl.value !== this.value) {
        this.formCtrl.setValue(this.value, { markDirty: false });
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
    if (this.streetEl) {
      this.inputCtrl.bind(this.streetEl);
    }
  }

  private handleSubfieldInput(key: keyof AddressValue, event: Event): void {
    if (this.formCtrl.disabled || this.formCtrl.readOnly) return;
    const input = event.target as HTMLInputElement;
    const nextFields: AddressValue = { ...this.fields, [key]: input.value };
    this.fields = nextFields;
    const nextValue = serializeAddressValue(nextFields);
    this.value = nextValue;
    this.formCtrl.setValue(nextValue, { markDirty: true });
    this.emitEvent('mth-input', { detail: { value: nextValue, address: { ...nextFields } } });
  }

  private handleSubfieldChange(): void {
    this.emitEvent('mth-change', { detail: { value: this.value, address: { ...this.fields } } });
  }

  private readonly handleGroupFocusOut = (event: FocusEvent): void => {
    const related = event.relatedTarget as Node | null;
    if (!related || !this.shadowRoot?.contains(related)) {
      this.formCtrl.markTouched();
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
      <fieldset
        part="base"
        class="fieldset"
        aria-describedby=${hasHint && !hasError ? 'mth-addr-hint' : nothing}
        aria-invalid=${isInvalid ? 'true' : 'false'}
        aria-errormessage=${isInvalid && hasError ? 'mth-addr-error' : nothing}
        @focusout=${this.handleGroupFocusOut}
      >
        <legend
          part="label"
          class=${hasFieldContext ? 'legend sr-only' : 'legend'}
          ?hidden=${!hasLabel}
        >
          <slot
            name="label"
            @slotchange=${(ev: Event) => this.handleTextSlotChange('label', ev)}
          >${effectiveLabel || this.t('defaultLabel')}</slot>
          ${isRequired && !hasFieldContext
            ? html`<span class="required-mark" aria-hidden="true">${this.t('requiredIndicator')}</span>`
            : nothing}
        </legend>

        <div part="grid" class="grid" data-invalid=${isInvalid ? 'true' : 'false'}>
          <div class="field field-full">
            <label for="mth-addr-street" class="sub-label">${this.t('streetLabel')}</label>
            <input
              id="mth-addr-street"
              part="control"
              class="control"
              type="text"
              autocomplete="street-address"
              .value=${this.fields.street}
              ?disabled=${isDisabled}
              ?required=${isRequired}
              ?readonly=${isReadonly}
              aria-invalid=${isInvalid ? 'true' : 'false'}
              @input=${(ev: Event) => this.handleSubfieldInput('street', ev)}
              @change=${() => this.handleSubfieldChange()}
            />
          </div>

          ${this.includeLine2
            ? html`
                <div class="field field-full">
                  <label for="mth-addr-street2" class="sub-label">${this.t('street2Label')}</label>
                  <input
                    id="mth-addr-street2"
                    part="control"
                    class="control"
                    type="text"
                    autocomplete="address-line2"
                    .value=${this.fields.street2 ?? ''}
                    ?disabled=${isDisabled}
                    ?readonly=${isReadonly}
                    @input=${(ev: Event) => this.handleSubfieldInput('street2', ev)}
                    @change=${() => this.handleSubfieldChange()}
                  />
                </div>
              `
            : nothing}

          <div class="field">
            <label for="mth-addr-city" class="sub-label">${this.t('cityLabel')}</label>
            <input
              id="mth-addr-city"
              part="control"
              class="control"
              type="text"
              autocomplete="address-level2"
              .value=${this.fields.city}
              ?disabled=${isDisabled}
              ?required=${isRequired}
              ?readonly=${isReadonly}
              aria-invalid=${isInvalid ? 'true' : 'false'}
              @input=${(ev: Event) => this.handleSubfieldInput('city', ev)}
              @change=${() => this.handleSubfieldChange()}
            />
          </div>

          <div class="field">
            <label for="mth-addr-region" class="sub-label">${this.t('regionLabel')}</label>
            <input
              id="mth-addr-region"
              part="control"
              class="control"
              type="text"
              autocomplete="address-level1"
              .value=${this.fields.region}
              ?disabled=${isDisabled}
              ?readonly=${isReadonly}
              @input=${(ev: Event) => this.handleSubfieldInput('region', ev)}
              @change=${() => this.handleSubfieldChange()}
            />
          </div>

          <div class="field">
            <label for="mth-addr-postal" class="sub-label">${this.t('postalCodeLabel')}</label>
            <input
              id="mth-addr-postal"
              part="control"
              class="control"
              type="text"
              autocomplete="postal-code"
              .value=${this.fields.postalCode}
              ?disabled=${isDisabled}
              ?required=${isRequired}
              ?readonly=${isReadonly}
              aria-invalid=${isInvalid ? 'true' : 'false'}
              @input=${(ev: Event) => this.handleSubfieldInput('postalCode', ev)}
              @change=${() => this.handleSubfieldChange()}
            />
          </div>

          <div class="field">
            <label for="mth-addr-country" class="sub-label">${this.t('countryLabel')}</label>
            <input
              id="mth-addr-country"
              part="control"
              class="control"
              type="text"
              autocomplete="country-name"
              .value=${this.fields.country}
              ?disabled=${isDisabled}
              ?required=${isRequired}
              ?readonly=${isReadonly}
              aria-invalid=${isInvalid ? 'true' : 'false'}
              @input=${(ev: Event) => this.handleSubfieldInput('country', ev)}
              @change=${() => this.handleSubfieldChange()}
            />
          </div>
        </div>

        <p
          id="mth-addr-hint"
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
          id="mth-addr-error"
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
      </fieldset>
    `;
  }
}
