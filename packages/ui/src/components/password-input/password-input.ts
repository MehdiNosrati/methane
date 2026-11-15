import { UIElement, type PropertyValues } from '@methane-ui/core';
import { FormControlController, InputController } from '@methane-ui/primitives';
import { html, nothing, svg } from 'lit';
import { property, query, state } from 'lit/decorators.js';
import { ifDefined } from 'lit/directives/if-defined.js';
import { passwordInputMessages } from './password-input.messages.js';
import { passwordInputStyles } from './password-input.styles.js';

export type PasswordStrengthScore = 0 | 1 | 2 | 3 | 4;

/**
 * Evaluates password strength on a 0-4 scale without retaining secret material.
 */
export function evaluatePasswordStrength(value: string): PasswordStrengthScore {
  if (value.length === 0) return 0;
  let score = 0;
  if (value.length >= 8) score += 1;
  if (value.length >= 12) score += 1;
  const variety =
    (Number(/[a-z]/.test(value)) +
      Number(/[A-Z]/.test(value)) +
      Number(/\d/.test(value)) +
      Number(/[^a-zA-Z\d]/.test(value))) |
    0;
  if (variety >= 2) score += 1;
  if (variety >= 3 && value.length >= 10) score += 1;
  return Math.max(1, Math.min(4, score)) as PasswordStrengthScore;
}

/**
 * `<mth-password-input>`: form-associated password field with visibility toggle,
 * optional password strength meter, minlength validation, and same-root ARIA.
 */
export class MthPasswordInput extends UIElement {
  static formAssociated = true;
  static override shadowRootOptions = { mode: 'open' as const, delegatesFocus: true };
  static override messages = passwordInputMessages;
  static override styles = passwordInputStyles;

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
  autocomplete = 'current-password';

  @property({ type: Boolean, reflect: true })
  revealed = false;

  @property({ type: Boolean, reflect: true })
  toggleable = true;

  @property({ type: Boolean, attribute: 'show-strength', reflect: true })
  showStrength = false;

  @property({ type: Number })
  minlength = 0;

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

  @query('#mth-password-control')
  private controlEl!: HTMLInputElement | null;

  private readonly formCtrl: FormControlController;
  private readonly inputCtrl: InputController;

  constructor() {
    super();
    this.formCtrl = new FormControlController(this, {
      internals: this.internals,
      defaultValue: '',
      messages: passwordInputMessages,
      onValueSync: (nextValue, source) => {
        const changed = this.value !== nextValue;
        this.value = nextValue;
        if (this.controlEl && this.controlEl.value !== nextValue) {
          this.controlEl.value = nextValue;
        }
        if (source === 'autofill' && changed) {
          this.emitEvent('mth-input', { detail: { value: nextValue } });
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
        if (this.minlength > 0 && str.length > 0 && str.length < this.minlength) {
          return {
            flags: { tooShort: true },
            message: this.t('tooShort', { min: this.minlength }),
          };
        }
        return null;
      },
    });

    this.inputCtrl = new InputController(this, {
      onCommitValue: (nextValue) => {
        this.value = nextValue;
        this.formCtrl.setValue(nextValue, { markDirty: true });
        this.emitEvent('mth-input', { detail: { value: nextValue } });
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

  get strength(): PasswordStrengthScore {
    return evaluatePasswordStrength(this.value);
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

  toggleReveal(): void {
    if (this.formCtrl.disabled) return;
    this.revealed = !this.revealed;
    this.emitEvent('mth-reveal-change', { detail: { revealed: this.revealed } });
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
    if (changedProperties.has('error') || changedProperties.has('minlength')) {
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

  private readonly handleNativeChange = (event: Event): void => {
    const target = event.target as HTMLInputElement;
    if (this.value !== target.value) {
      this.value = target.value;
      this.formCtrl.setValue(target.value, { markDirty: true });
    }
    this.emitEvent('mth-change', { detail: { value: target.value } });
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

  private resolveStrengthLevelText(score: PasswordStrengthScore): string {
    switch (score) {
      case 0:
        return this.t('strengthEmpty');
      case 1:
        return this.t('strengthWeak');
      case 2:
        return this.t('strengthFair');
      case 3:
        return this.t('strengthGood');
      case 4:
        return this.t('strengthStrong');
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
    const strengthScore = this.strength;
    const strengthText = this.showStrength
      ? this.t('strengthLabel', { level: this.resolveStrengthLevelText(strengthScore) })
      : '';

    return html`
      <div part="base" class="base">
        <label
          id="mth-password-label"
          for="mth-password-control"
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
          <slot name="prefix"></slot>
          <input
            id="mth-password-control"
            part="control"
            class="control"
            type=${this.revealed ? 'text' : 'password'}
            .value=${this.value}
            name=${ifDefined(this.name || undefined)}
            placeholder=${ifDefined(this.placeholder || undefined)}
            autocomplete=${ifDefined(this.autocomplete || undefined)}
            aria-label=${!hasLabel ? this.t('defaultLabel') : nothing}
            ?disabled=${isDisabled}
            ?required=${isRequired}
            ?readonly=${isReadonly}
            aria-invalid=${isInvalid ? 'true' : 'false'}
            aria-describedby=${hasHint && !hasError ? 'mth-password-hint' : nothing}
            aria-errormessage=${isInvalid && hasError ? 'mth-password-error' : nothing}
            @change=${this.handleNativeChange}
            @blur=${this.handleNativeBlur}
            @keydown=${this.handleNativeKeydown}
          />
          ${this.toggleable
            ? html`
                <button
                  type="button"
                  part="toggle"
                  class="toggle"
                  ?disabled=${isDisabled}
                  aria-pressed=${this.revealed ? 'true' : 'false'}
                  aria-label=${this.revealed ? this.t('hidePassword') : this.t('showPassword')}
                  @click=${() => this.toggleReveal()}
                >
                  ${this.revealed
                    ? svg`<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M17.94 17.94A10.94 10.94 0 0 1 12 20c-7 0-11-8-11-8a21.77 21.77 0 0 1 5.06-5.94M9.9 4.24A10.7 10.7 0 0 1 12 4c7 0 11 8 11 8a21.8 21.8 0 0 1-2.16 3.19M1 1l22 22" /></svg>`
                    : svg`<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8Z" /><circle cx="12" cy="12" r="3" /></svg>`}
                </button>
              `
            : nothing}
        </div>
        ${this.showStrength
          ? html`
              <div part="strength" class="strength">
                <div class="strength-track" aria-hidden="true">
                  <div
                    part="strength-bar"
                    class="strength-bar"
                    data-strength=${String(strengthScore)}
                  ></div>
                </div>
                <p class="strength-text" aria-live="polite">${strengthText}</p>
              </div>
            `
          : nothing}
        <p
          id="mth-password-hint"
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
          id="mth-password-error"
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
