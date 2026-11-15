import {
  UIElement,
  html,
  nothing,
  property,
  query,
  type PropertyValues,
} from '@methane/core';
import { FormControlController, RovingFocusController } from '@methane/primitives';
import { mfaChallengeMessages } from './mfa-challenge.messages.js';
import { mfaChallengeStyles } from './mfa-challenge.styles.js';

export type MthMfaMode = 'totp' | 'backup';

/**
 * `<mth-mfa-challenge>`: FACE multi-factor authentication input supporting 6-digit
 * TOTP cells (multi-cell paste, backspace retreat, RTL roving arrows) and backup recovery codes.
 */
export class MthMfaChallenge extends UIElement {
  static formAssociated = true;
  static override shadowRootOptions = { mode: 'open' as const, delegatesFocus: true };
  static override messages = mfaChallengeMessages;
  static override styles = mfaChallengeStyles;

  @property({ type: String, reflect: true })
  mode: MthMfaMode = 'totp';

  @property({ type: Number })
  length = 6;

  @property({ type: String })
  value = '';

  @property({ type: String, reflect: true })
  name = '';

  @property({ type: String })
  error = '';

  @property({ type: Boolean, reflect: true })
  loading = false;

  @property({ type: Boolean, reflect: true })
  disabled = false;

  @property({ type: Boolean, reflect: true })
  required = true;

  @property({ type: Boolean, reflect: true, attribute: 'allow-resend' })
  allowResend = false;

  @query('#mth-mfa-backup')
  private readonly backupInput?: HTMLInputElement;

  private readonly formCtrl: FormControlController;
  private readonly rovingCtrl: RovingFocusController;

  constructor() {
    super();
    this.formCtrl = new FormControlController(this, {
      internals: this.internals,
      defaultValue: '',
      required: this.required,
      disabled: this.disabled,
      messages: mfaChallengeMessages,
      validator: ({ value, required }) => {
        const str = typeof value === 'string' ? value.trim() : '';
        if (!str) {
          return required
            ? { flags: { valueMissing: true }, message: this.t('requiredError') }
            : null;
        }
        if (this.mode === 'totp' && str.length < this.length) {
          return {
            flags: { customError: true },
            message: this.t('incompleteError', { length: this.length }),
          };
        }
        return null;
      },
      onValueSync: (nextVal) => {
        this.value = nextVal;
      },
      onDisabledChange: () => {
        this.syncStates();
        this.requestUpdate();
      },
      onSetCustomState: (stateName, active) => {
        this.setCustomState(stateName, active);
      },
    });
    this.rovingCtrl = new RovingFocusController(this, {
      getItems: () => this.getDigitElements(),
      orientation: 'horizontal',
      loop: false,
      dir: this.resolvedDir,
    });
    this.syncStates();
  }

  get effectivelyDisabled(): boolean {
    return this.formCtrl.disabled || this.loading;
  }

  get invalid(): boolean {
    return this.formCtrl.invalid || Boolean(this.error);
  }

  get validationMessage(): string {
    return this.formCtrl.validationMessage;
  }

  getDigitElements(): HTMLInputElement[] {
    if (!this.shadowRoot || this.mode !== 'totp') return [];
    return Array.from(this.shadowRoot.querySelectorAll<HTMLInputElement>('[part="digit"]'));
  }

  override formDisabledCallback(disabled: boolean): void {
    this.formCtrl.handleFormDisabled(disabled);
    this.requestUpdate();
  }

  override formResetCallback(): void {
    this.formCtrl.handleFormReset();
    this.syncStates();
  }

  override formStateRestoreCallback(
    state: string | File | FormData | null,
    restoreMode: 'restore' | 'autocomplete',
  ): void {
    this.formCtrl.handleFormStateRestore(state, restoreMode);
    this.syncStates();
  }

  checkValidity(): boolean {
    return this.formCtrl.checkValidity(this.getValidationAnchorEl());
  }

  reportValidity(): boolean {
    return this.formCtrl.reportValidity(this.getValidationAnchorEl());
  }

  protected override willUpdate(changedProperties: PropertyValues): void {
    super.willUpdate(changedProperties);
    if (changedProperties.has('value') || changedProperties.has('mode') || changedProperties.has('length')) {
      this.formCtrl.setValue(this.value, { markDirty: this.hasUpdated });
    }
    if (changedProperties.has('required')) {
      this.formCtrl.required = this.required;
    }
    if (changedProperties.has('disabled')) {
      this.formCtrl.hostDisabled = this.disabled;
    }
    if (changedProperties.has('error')) {
      this.formCtrl.setValidity(
        this.error ? { customError: true } : {},
        this.error || undefined,
        this.getValidationAnchorEl(),
      );
    }
    this.syncStates();
    this.rovingCtrl.updateOptions({
      dir: this.resolvedDir,
    });
  }

  private syncStates(): void {
    this.setCustomState('loading', this.loading);
    this.setCustomState('disabled', this.effectivelyDisabled);
  }

  private getValidationAnchorEl(): HTMLElement | undefined {
    if (this.mode === 'backup') return this.backupInput;
    return this.getDigitElements()[0];
  }

  private getDigitsArray(): string[] {
    const len = Math.max(1, this.length);
    const cleaned = this.value.replace(/\D/g, '').slice(0, len);
    return Array.from({ length: len }, (_, i) => cleaned[i] ?? '');
  }

  private setTotpDigits(digits: string[]): void {
    const next = digits.join('').slice(0, Math.max(1, this.length));
    this.value = next;
    this.formCtrl.setValue(next, { markDirty: true });
    this.emitEvent('mth-input', { detail: { value: next, mode: this.mode } });
    this.emitEvent('mth-change', { detail: { value: next, mode: this.mode } });
    if (next.length === Math.max(1, this.length)) {
      this.emitEvent('mth-complete', { detail: { value: next, mode: this.mode } });
    }
  }

  private handleDigitInput(index: number, event: Event): void {
    if (this.effectivelyDisabled) return;
    const input = event.target as HTMLInputElement;
    const numeric = input.value.replace(/\D/g, '');
    const digits = this.getDigitsArray();

    if (numeric.length > 1) {
      for (let offset = 0; offset < numeric.length && index + offset < digits.length; offset += 1) {
        digits[index + offset] = numeric[offset]!;
      }
      this.setTotpDigits(digits);
      const nextIdx = Math.min(digits.length - 1, index + numeric.length);
      this.rovingCtrl.setActiveIndex(nextIdx, true);
      return;
    }

    digits[index] = numeric;
    input.value = numeric;
    this.setTotpDigits(digits);

    if (numeric && index + 1 < digits.length) {
      this.rovingCtrl.setActiveIndex(index + 1, true);
    }
  }

  private handleDigitKeyDown(index: number, event: KeyboardEvent): void {
    if (this.effectivelyDisabled) return;
    const digits = this.getDigitsArray();
    if (event.key === 'Backspace') {
      if (digits[index]) {
        digits[index] = '';
        this.setTotpDigits(digits);
      } else if (index > 0) {
        event.preventDefault();
        digits[index - 1] = '';
        this.setTotpDigits(digits);
        this.rovingCtrl.setActiveIndex(index - 1, true);
      }
    } else if (event.key === 'Enter') {
      event.preventDefault();
      this.handleSubmit();
    }
  }

  private handleDigitPaste(index: number, event: ClipboardEvent): void {
    if (this.effectivelyDisabled) return;
    const text = event.clipboardData?.getData('text') ?? '';
    const numeric = text.replace(/\D/g, '');
    if (!numeric) return;
    event.preventDefault();

    const digits = this.getDigitsArray();
    for (let offset = 0; offset < numeric.length && index + offset < digits.length; offset += 1) {
      digits[index + offset] = numeric[offset]!;
    }
    this.setTotpDigits(digits);
    const focusIdx = Math.min(digits.length - 1, index + numeric.length - 1);
    this.rovingCtrl.setActiveIndex(focusIdx, true);
  }

  private handleBackupInput(event: Event): void {
    if (this.effectivelyDisabled) return;
    const input = event.target as HTMLInputElement;
    this.value = input.value;
    this.formCtrl.setValue(this.value, { markDirty: true });
    this.emitEvent('mth-input', { detail: { value: this.value, mode: this.mode } });
  }

  private handleBackupChange(event: Event): void {
    if (this.effectivelyDisabled) return;
    const input = event.target as HTMLInputElement;
    this.value = input.value;
    this.formCtrl.setValue(this.value, { markDirty: true });
    this.emitEvent('mth-change', { detail: { value: this.value, mode: this.mode } });
  }

  private handleModeToggle(): void {
    if (this.effectivelyDisabled) return;
    this.mode = this.mode === 'totp' ? 'backup' : 'totp';
    this.value = '';
    this.formCtrl.setValue('', { markDirty: true });
    this.emitEvent('mth-mode-change', { detail: { mode: this.mode } });
  }

  private handleResend(): void {
    if (this.effectivelyDisabled) return;
    this.emitEvent('mth-resend');
  }

  private handleSubmit(): void {
    if (this.effectivelyDisabled) return;
    this.formCtrl.markTouched();
    if (!this.reportValidity()) {
      this.requestUpdate();
      return;
    }
    this.emitEvent('mth-submit', { detail: { value: this.value.trim(), mode: this.mode } });
  }

  override render() {
    const isDisabled = this.effectivelyDisabled;
    const digits = this.getDigitsArray();
    const hasError = Boolean(this.error.trim());

    return html`
      <div part="base" class="card" dir=${this.resolvedDir}>
        <div class="header">
          <h2 class="title" id="mth-mfa-title">${this.t('heading')}</h2>
          <p class="description" id="mth-mfa-desc">
            ${this.mode === 'totp' ? this.t('totpInstructions') : this.t('backupInstructions')}
          </p>
        </div>

        ${this.mode === 'totp'
          ? html`
              <div
                part="digits"
                class="digits"
                role="group"
                aria-labelledby="mth-mfa-title"
                aria-describedby="mth-mfa-desc mth-mfa-err"
              >
                ${digits.map(
                  (digit, index) => html`
                    <input
                      part="digit"
                      class="digit"
                      type="text"
                      inputmode="numeric"
                      autocomplete=${index === 0 ? 'one-time-code' : 'off'}
                      maxlength="1"
                      tabindex=${index === 0 ? 0 : -1}
                      aria-label=${this.t('digitLabel', {
                        index: index + 1,
                        total: digits.length,
                      })}
                      aria-invalid=${hasError ? 'true' : 'false'}
                      .value=${digit}
                      ?disabled=${isDisabled}
                      @input=${(ev: Event) => this.handleDigitInput(index, ev)}
                      @keydown=${(ev: KeyboardEvent) => this.handleDigitKeyDown(index, ev)}
                      @paste=${(ev: ClipboardEvent) => this.handleDigitPaste(index, ev)}
                    />
                  `,
                )}
              </div>
            `
          : html`
              <div class="backup-wrap">
                <label class="backup-label" for="mth-mfa-backup">${this.t('backupLabel')}</label>
                <input
                  id="mth-mfa-backup"
                  part="backup-input"
                  class="backup-input"
                  type="text"
                  autocomplete="one-time-code"
                  placeholder=${this.t('backupPlaceholder')}
                  aria-describedby="mth-mfa-desc mth-mfa-err"
                  aria-invalid=${hasError ? 'true' : 'false'}
                  .value=${this.value}
                  ?disabled=${isDisabled}
                  @input=${this.handleBackupInput}
                  @change=${this.handleBackupChange}
                />
              </div>
            `}

        <p
          id="mth-mfa-err"
          class="error-text"
          role="alert"
          ?hidden=${!hasError}
        >
          ${this.error}
        </p>

        <div class="actions">
          <div class="secondary-actions">
            <button
              type="button"
              class="link-btn"
              ?disabled=${isDisabled}
              @click=${this.handleModeToggle}
            >
              ${this.mode === 'totp' ? this.t('useBackup') : this.t('useTotp')}
            </button>
            ${this.allowResend && this.mode === 'totp'
              ? html`
                  <button
                    type="button"
                    class="link-btn"
                    ?disabled=${isDisabled}
                    @click=${this.handleResend}
                  >
                    ${this.t('resend')}
                  </button>
                `
              : nothing}
          </div>

          <button
            type="button"
            part="submit"
            class="submit-btn"
            ?disabled=${isDisabled}
            @click=${this.handleSubmit}
          >
            ${this.t('submit')}
          </button>
        </div>

        <slot></slot>
      </div>
    `;
  }
}
