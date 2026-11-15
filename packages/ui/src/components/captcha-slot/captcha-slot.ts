import { UIElement, type PropertyValues } from '@methane-ui/core';
import { FormControlController } from '@methane-ui/primitives';
import { html, nothing } from 'lit';
import { property, query, state } from 'lit/decorators.js';
import { captchaSlotMessages } from './captcha-slot.messages.js';
import { captchaSlotStyles } from './captcha-slot.styles.js';

/**
 * `<mth-captcha-slot>`: provider-agnostic Light-DOM CAPTCHA host slot bridging
 * external verification widgets to standard FACE form validity and FormData.
 */
export class MthCaptchaSlot extends UIElement {
  static formAssociated = true;
  static override shadowRootOptions = { mode: 'open' as const, delegatesFocus: true };
  static override messages = captchaSlotMessages;
  static override styles = captchaSlotStyles;

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

  @property({ type: String, reflect: true })
  provider = 'custom';

  @property({ type: String })
  sitekey = '';

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

  @query('#mth-captcha-container')
  private containerEl!: HTMLElement | null;

  private readonly formCtrl: FormControlController;

  constructor() {
    super();
    this.formCtrl = new FormControlController(this, {
      internals: this.internals,
      defaultValue: '',
      messages: captchaSlotMessages,
      onValueSync: (nextValue) => {
        this.value = nextValue;
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
        const str = typeof value === 'string' ? value.trim() : '';
        if (required && str.length === 0) {
          return { flags: { valueMissing: true }, message: this.t('challengeMissing') };
        }
        return null;
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

  get verified(): boolean {
    return this.value.trim().length > 0;
  }

  override focus(options?: FocusOptions): void {
    const resetBtn = this.shadowRoot?.querySelector<HTMLElement>('[part="reset"]');
    if (resetBtn) {
      resetBtn.focus(options);
      return;
    }
    this.containerEl?.focus(options);
  }

  checkValidity(): boolean {
    return this.formCtrl.checkValidity();
  }

  reportValidity(): boolean {
    return this.formCtrl.reportValidity();
  }

  setToken(token: string): void {
    if (this.formCtrl.disabled || this.formCtrl.readOnly) return;
    const trimmed = token.trim();
    this.value = trimmed;
    this.formCtrl.setValue(trimmed, { markDirty: true });
    this.formCtrl.markTouched();
    this.emitEvent('mth-change', { detail: { value: trimmed } });
    if (trimmed.length > 0) {
      this.emitEvent('mth-verify', { detail: { token: trimmed, provider: this.provider } });
    } else {
      this.emitEvent('mth-expire', { detail: { provider: this.provider } });
    }
  }

  markExpired(): void {
    if (this.formCtrl.disabled || this.formCtrl.readOnly) return;
    this.value = '';
    this.formCtrl.setValue('', { markDirty: true });
    this.emitEvent('mth-expire', { detail: { provider: this.provider } });
    this.emitEvent('mth-change', { detail: { value: '' } });
  }

  reportProviderError(message: string): void {
    this.error = message;
    this.formCtrl.validate();
    this.emitEvent('mth-error', { detail: { provider: this.provider, message } });
  }

  reset(): void {
    this.markExpired();
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
    }
    if (changedProperties.has('error')) {
      this.formCtrl.validate();
    }

    this.setCustomState('required', this.formCtrl.required);
    this.setCustomState('readonly', this.formCtrl.readOnly);
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
    const isVerified = this.verified;

    return html`
      <div part="base" class="base">
        <span
          id="mth-captcha-label"
          part="label"
          class=${hasFieldContext ? 'label sr-only' : 'label'}
          ?hidden=${!hasLabel}
        >
          <slot
            name="label"
            @slotchange=${(ev: Event) => this.handleTextSlotChange('label', ev)}
          >${effectiveLabel || this.t('defaultLabel')}</slot>
          ${isRequired && !hasFieldContext
            ? html`<span class="required-mark" aria-hidden="true">${this.t('requiredIndicator')}</span>`
            : nothing}
        </span>

        <div
          id="mth-captcha-container"
          part="container"
          class="container"
          role="group"
          tabindex=${isDisabled ? '-1' : '0'}
          data-provider=${this.provider}
          data-sitekey=${this.sitekey}
          data-invalid=${isInvalid ? 'true' : 'false'}
          aria-labelledby=${hasLabel ? 'mth-captcha-label' : nothing}
          aria-label=${!hasLabel ? this.t('defaultLabel') : nothing}
          aria-describedby=${hasHint && !hasError ? 'mth-captcha-hint' : nothing}
          aria-invalid=${isInvalid ? 'true' : 'false'}
          aria-errormessage=${isInvalid && hasError ? 'mth-captcha-error' : nothing}
          aria-disabled=${isDisabled ? 'true' : 'false'}
        >
          <slot></slot>
          <slot name="fallback"></slot>
          <div class="footer">
            <span part="status" class="status" data-verified=${isVerified ? 'true' : 'false'} aria-live="polite">
              ${isVerified ? this.t('verifiedStatus') : this.t('pendingStatus')}
            </span>
            ${isVerified && !isDisabled && !isReadonly
              ? html`
                  <button
                    type="button"
                    part="reset"
                    class="reset"
                    @click=${() => this.reset()}
                  >
                    ${this.t('resetLabel')}
                  </button>
                `
              : nothing}
          </div>
        </div>

        <p
          id="mth-captcha-hint"
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
          id="mth-captcha-error"
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
