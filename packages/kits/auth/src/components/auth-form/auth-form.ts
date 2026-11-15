import {
  UIElement,
  html,
  nothing,
  property,
  query,
  type PropertyValues,
} from '@methane/core';
import { FormControlController, InputController } from '@methane/primitives';
import { authFormMessages } from './auth-form.messages.js';
import { authFormStyles } from './auth-form.styles.js';

export type MthAuthFormMode = 'signin' | 'signup' | 'reset' | 'magic-link';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * `<mth-auth-form>`: multi-mode authentication form (`signin | signup | reset | magic-link`)
 * with autofill-compatible `autocomplete`, FACE validation, and `<mth-alert>` error display.
 */
export class MthAuthForm extends UIElement {
  static formAssociated = true;
  static override shadowRootOptions = { mode: 'open' as const, delegatesFocus: true };
  static override messages = authFormMessages;
  static override styles = authFormStyles;

  @property({ type: String, reflect: true })
  mode: MthAuthFormMode = 'signin';

  @property({ type: String })
  value = '';

  @property({ type: String, reflect: true })
  name = '';

  @property({ type: String })
  email = '';

  @property({ type: String })
  password = '';

  @property({ type: String, attribute: 'full-name' })
  fullName = '';

  @property({ type: String })
  error = '';

  @property({ type: Boolean, reflect: true })
  loading = false;

  @property({ type: Boolean, reflect: true })
  disabled = false;

  @property({ type: Boolean, reflect: true })
  required = true;

  @property({ type: String, attribute: 'submit-label' })
  submitLabel = '';

  @query('#mth-af-email')
  private emailInputEl!: HTMLInputElement | null;

  @query('#mth-af-password')
  private passwordInputEl!: HTMLInputElement | null;

  private readonly formCtrl: FormControlController;
  private readonly inputCtrl: InputController;

  constructor() {
    super();

    this.formCtrl = new FormControlController(this, {
      internals: this.internals,
      defaultValue: '',
      required: this.required,
      disabled: this.disabled,
      messages: authFormMessages,
      validator: ({ value, required }) => {
        const emailVal = typeof value === 'string' ? value.trim() : '';
        if (!emailVal) {
          return required
            ? { flags: { valueMissing: true }, message: this.t('valueMissing') }
            : null;
        }
        if (!EMAIL_RE.test(emailVal)) {
          return { flags: { typeMismatch: true }, message: this.t('invalidEmail') };
        }
        if ((this.mode === 'signin' || this.mode === 'signup') && required && !this.password) {
          return { flags: { valueMissing: true }, message: this.t('passwordRequired') };
        }
        return null;
      },
      onValueSync: (nextVal) => {
        this.value = nextVal;
        this.email = nextVal;
      },
      onDisabledChange: () => {
        this.syncStates();
      },
      onSetCustomState: (name, active) => {
        this.setCustomState(name, active);
      },
    });

    this.inputCtrl = new InputController(this, {
      onCommitValue: (nextVal) => {
        this.applyEmail(nextVal);
      },
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

  override focus(options?: FocusOptions): void {
    this.emailInputEl?.focus(options);
  }

  checkValidity(): boolean {
    return this.formCtrl.checkValidity(this.emailInputEl ?? undefined);
  }

  reportValidity(): boolean {
    return this.formCtrl.reportValidity(this.emailInputEl ?? undefined);
  }

  submit(): boolean {
    if (this.effectivelyDisabled) return false;
    this.formCtrl.markTouched();
    const ok = this.reportValidity();
    this.syncStates();
    if (!ok) {
      return false;
    }
    return this.emitEvent('mth-submit', {
      detail: {
        mode: this.mode,
        email: this.email,
        password: this.password,
        fullName: this.fullName,
      },
      cancelable: true,
    });
  }

  protected override onFirstConnect(): void {
    const initial = this.email || this.value || '';
    this.email = initial;
    this.value = initial;
    this.formCtrl.setDefaultValue(this.getAttribute('value') ?? initial);
    this.formCtrl.setValue(initial, { markDirty: false });
    this.syncStates();
  }

  protected override onFormDisabled(disabled: boolean): void {
    this.formCtrl.handleFormDisabled(disabled);
    this.syncStates();
    this.requestUpdate();
  }

  protected override onFormReset(): void {
    this.formCtrl.handleFormReset();
    this.password = '';
    this.fullName = '';
    this.syncStates();
  }

  protected override willUpdate(changedProperties: PropertyValues): void {
    super.willUpdate(changedProperties);
    if (changedProperties.has('value') && this.value !== this.email) {
      this.email = this.value;
      this.formCtrl.setValue(this.value, { markDirty: this.hasUpdated });
    } else if (changedProperties.has('email') && this.email !== this.value) {
      this.value = this.email;
      this.formCtrl.setValue(this.email, { markDirty: this.hasUpdated });
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
        this.emailInputEl ?? undefined,
      );
    }
    this.syncStates();
  }

  protected override updated(changedProperties: PropertyValues): void {
    super.updated(changedProperties);
    this.inputCtrl.bind(this.emailInputEl);
  }

  private syncStates(): void {
    this.setCustomState('loading', this.loading);
    this.setCustomState('disabled', this.effectivelyDisabled);
  }

  private applyEmail(nextEmail: string): void {
    this.email = nextEmail;
    this.value = nextEmail;
    this.formCtrl.setValue(nextEmail, { markDirty: true });
    this.emitChange();
  }

  private emitChange(): void {
    this.emitEvent('mth-change', {
      detail: { email: this.email, password: this.password, fullName: this.fullName },
    });
  }

  private resolveTitle(): string {
    switch (this.mode) {
      case 'signup':
        return this.t('signUpTitle');
      case 'reset':
        return this.t('resetTitle');
      case 'magic-link':
        return this.t('magicLinkTitle');
      default:
        return this.t('signInTitle');
    }
  }

  private resolveSubmitLabel(): string {
    if (this.submitLabel) return this.submitLabel;
    switch (this.mode) {
      case 'signup':
        return this.t('signUpSubmit');
      case 'reset':
        return this.t('resetSubmit');
      case 'magic-link':
        return this.t('magicLinkSubmit');
      default:
        return this.t('signInSubmit');
    }
  }

  private readonly handleEmailInput = (event: Event): void => {
    if (this.inputCtrl.isComposing) return;
    this.applyEmail((event.target as HTMLInputElement).value);
  };

  private readonly handlePasswordInput = (event: Event): void => {
    this.password = (event.target as HTMLInputElement).value;
    this.formCtrl.validate(this.passwordInputEl ?? undefined);
    this.emitChange();
  };

  private readonly handleNameInput = (event: Event): void => {
    this.fullName = (event.target as HTMLInputElement).value;
    this.emitChange();
  };

  private readonly handleFormSubmit = (event: Event): void => {
    event.preventDefault();
    this.submit();
  };

  override render() {
    const isDisabled = this.effectivelyDisabled;
    const showPassword = this.mode === 'signin' || this.mode === 'signup';
    const showName = this.mode === 'signup';
    const headingId = 'mth-af-heading';
    const errorId = 'mth-af-error';
    const resolvedError =
      this.error ||
      (this.formCtrl.invalid && this.formCtrl.touched ? this.formCtrl.validationMessage : '');

    return html`
      <div class="card" part="base">
        <form class="form" aria-labelledby=${headingId} @submit=${this.handleFormSubmit} novalidate>
          <slot name="header"></slot>
          <h2 id=${headingId} class="heading" part="heading">${this.resolveTitle()}</h2>

          <div id=${errorId} class="error-banner" part="error" ?hidden=${!resolvedError}>
            ${resolvedError
              ? html`<mth-alert variant="danger">${resolvedError}</mth-alert>`
              : nothing}
          </div>

          ${showName
            ? html`
                <div class="field">
                  <label class="label" for="mth-af-name">${this.t('nameLabel')}</label>
                  <input
                    id="mth-af-name"
                    class="input"
                    type="text"
                    autocomplete="name"
                    .value=${this.fullName}
                    ?disabled=${isDisabled}
                    @input=${this.handleNameInput}
                  />
                </div>
              `
            : nothing}

          <div class="field">
            <label class="label" for="mth-af-email">${this.t('emailLabel')}</label>
            <input
              id="mth-af-email"
              class="input"
              part="email-input"
              type="email"
              inputmode="email"
              autocomplete="email"
              .value=${this.email}
              aria-invalid=${this.invalid ? 'true' : 'false'}
              aria-errormessage=${resolvedError ? errorId : nothing}
              ?required=${this.required}
              ?disabled=${isDisabled}
              @input=${this.handleEmailInput}
            />
          </div>

          ${showPassword
            ? html`
                <div class="field">
                  <label class="label" for="mth-af-password">${this.t('passwordLabel')}</label>
                  <input
                    id="mth-af-password"
                    class="input"
                    part="password-input"
                    type="password"
                    autocomplete=${this.mode === 'signup' ? 'new-password' : 'current-password'}
                    .value=${this.password}
                    aria-invalid=${this.invalid ? 'true' : 'false'}
                    ?required=${this.required}
                    ?disabled=${isDisabled}
                    @input=${this.handlePasswordInput}
                  />
                </div>
              `
            : nothing}

          <div class="actions">
            <mth-button
              type="submit"
              variant="solid"
              part="submit-button"
              ?loading=${this.loading}
              ?disabled=${isDisabled}
              @click=${this.handleFormSubmit}
            >
              ${this.resolveSubmitLabel()}
            </mth-button>
            <slot name="footer"></slot>
          </div>
        </form>
      </div>
    `;
  }
}
