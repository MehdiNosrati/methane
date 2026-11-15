import { UIElement, type PropertyValues } from '@methane-ui/core';
import { FormControlController, InputController } from '@methane-ui/primitives';
import { html, nothing } from 'lit';
import { property, query, state } from 'lit/decorators.js';
import { newsletterFormMessages } from './newsletter-form.messages.js';
import { newsletterFormStyles } from './newsletter-form.styles.js';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * `<mth-newsletter-form>`: form-associated newsletter signup control wrapping
 * `FormControlController` and `InputController`.
 */
export class MthNewsletterForm extends UIElement {
  static formAssociated = true;
  static override shadowRootOptions = {
    ...UIElement.shadowRootOptions,
    delegatesFocus: true,
  };
  static override messages = newsletterFormMessages;
  static override styles = newsletterFormStyles;

  @property({ type: String })
  value = '';

  @property({ type: String, reflect: true })
  name = 'email';

  @property({ type: String })
  heading = '';

  @property({ type: String })
  placeholder = '';

  @property({ type: String, attribute: 'submit-label' })
  submitLabel = '';

  @property({ type: Boolean, reflect: true })
  required = true;

  @property({ type: Boolean, reflect: true })
  disabled = false;

  @property({ type: Boolean, reflect: true })
  submitted = false;

  @state()
  private errorMessage = '';

  @query('.input')
  private inputEl!: HTMLInputElement | null;

  private readonly formCtrl: FormControlController;
  private readonly inputCtrl: InputController;

  constructor() {
    super();

    this.formCtrl = new FormControlController(this, {
      internals: this.internals,
      defaultValue: '',
      required: this.required,
      disabled: this.disabled,
      messages: newsletterFormMessages,
      validator: ({ value, required }) => {
        const raw = typeof value === 'string' ? value.trim() : '';
        if (!raw) {
          if (required) {
            return { flags: { valueMissing: true }, message: this.t('requiredEmail') };
          }
          return null;
        }
        if (!EMAIL_RE.test(raw)) {
          return { flags: { typeMismatch: true }, message: this.t('invalidEmail') };
        }
        return null;
      },
      onValueSync: (nextVal, source) => {
        this.value = nextVal;
        if (source === 'reset') {
          this.submitted = false;
          this.errorMessage = '';
        }
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
        this.applyValueInput(nextVal);
      },
    });

    this.syncStates();
  }

  protected override updated(changedProperties: PropertyValues): void {
    super.updated(changedProperties);
    this.inputCtrl.bind(this.inputEl);
  }

  get invalid(): boolean {
    return this.formCtrl.invalid;
  }

  get effectivelyDisabled(): boolean {
    return this.formCtrl.disabled;
  }

  get validationMessage(): string {
    return this.formCtrl.validationMessage;
  }

  checkValidity(): boolean {
    return this.formCtrl.checkValidity(this.inputEl ?? undefined);
  }

  reportValidity(): boolean {
    const ok = this.formCtrl.reportValidity(this.inputEl ?? undefined);
    this.errorMessage = ok ? '' : this.formCtrl.validationMessage;
    return ok;
  }

  protected override onFormDisabled(disabled: boolean): void {
    this.formCtrl.handleFormDisabled(disabled);
    this.syncStates();
  }

  protected override onFormReset(): void {
    this.formCtrl.handleFormReset();
    this.syncStates();
  }

  protected override onFormStateRestore(
    stateVal: File | string | FormData | null,
    mode: 'restore' | 'autocomplete',
  ): void {
    this.formCtrl.handleFormStateRestore(stateVal, mode);
    this.syncStates();
  }

  protected override willUpdate(changedProperties: PropertyValues): void {
    super.willUpdate(changedProperties);
    if (changedProperties.has('disabled')) {
      this.formCtrl.hostDisabled = this.disabled;
    }
    if (changedProperties.has('required')) {
      this.formCtrl.required = this.required;
    }
    if (changedProperties.has('value')) {
      this.formCtrl.setValue(this.value);
      this.formCtrl.validate(this.inputEl ?? undefined);
    }
    if (
      changedProperties.has('submitted') ||
      changedProperties.has('disabled') ||
      changedProperties.has('required') ||
      changedProperties.has('value')
    ) {
      this.syncStates();
    }
  }

  public submit(): boolean {
    if (this.formCtrl.disabled || this.inputCtrl.isComposing) {
      return false;
    }
    this.formCtrl.markTouched();
    this.formCtrl.markSubmitted();
    this.formCtrl.setValue(this.value);
    const valid = this.formCtrl.validate(this.inputEl ?? undefined);
    if (!valid) {
      this.errorMessage = this.formCtrl.validationMessage;
      this.submitted = false;
      this.syncStates();
      return false;
    }
    const email = this.value.trim();
    const allowed = this.emitEvent('mth-submit', {
      cancelable: true,
      detail: { email },
    });
    if (allowed) {
      this.errorMessage = '';
      this.submitted = true;
      this.syncStates();
    }
    return allowed;
  }

  private syncStates(): void {
    this.setCustomState('submitted', this.submitted);
    this.setCustomState('invalid', this.formCtrl.invalid);
    this.setCustomState('disabled', this.formCtrl.disabled);
  }

  private applyValueInput(nextVal: string): void {
    this.value = nextVal;
    this.submitted = false;
    this.formCtrl.setValue(nextVal, { markDirty: true });
    this.formCtrl.validate(this.inputEl ?? undefined);
    this.errorMessage = '';
    this.emitEvent('input', { bubbles: true, composed: true });
  }

  private readonly handleNativeInput = (event: Event): void => {
    const target = event.target as HTMLInputElement | null;
    if (!target || this.inputCtrl.isComposing) {
      return;
    }
    this.applyValueInput(target.value);
  };

  private readonly handleNativeChange = (event: Event): void => {
    const target = event.target as HTMLInputElement | null;
    if (!target) {
      return;
    }
    this.value = target.value;
    this.formCtrl.markTouched();
    this.formCtrl.setValue(target.value);
    const ok = this.formCtrl.validate(this.inputEl ?? undefined);
    this.errorMessage = ok ? '' : this.formCtrl.validationMessage;
    this.emitEvent('change', { bubbles: true, composed: true });
  };

  private readonly handleFormSubmit = (event: Event): void => {
    event.preventDefault();
    this.submit();
  };

  protected override render() {
    const fieldCtx = this.formCtrl.fieldContext;
    const isDisabled = this.formCtrl.disabled;
    const resolvedHeading = this.heading || fieldCtx?.label || this.t('heading');
    const resolvedDesc = fieldCtx?.hint || this.t('description');
    const resolvedPlaceholder = this.placeholder || this.t('emailPlaceholder');
    const resolvedSubmit = this.submitLabel || this.t('submitLabel');
    const statusText = this.errorMessage || (this.submitted ? this.t('successMessage') : '');

    return html`
      <form class="base" part="base" novalidate @submit=${this.handleFormSubmit}>
        <div>
          <slot name="header">
            <h3 class="heading" part="heading">${resolvedHeading}</h3>
            <p class="description" part="description">${resolvedDesc}</p>
          </slot>
        </div>

        <div class="controls" part="controls">
          <input
            class="input"
            part="input"
            type="email"
            .value=${this.value}
            name=${this.name || nothing}
            placeholder=${resolvedPlaceholder}
            aria-label=${this.t('emailLabel')}
            aria-invalid=${this.formCtrl.invalid && (this.formCtrl.touched || this.formCtrl.submitted) ? 'true' : 'false'}
            aria-describedby=${statusText ? 'mth-nf-status' : nothing}
            aria-errormessage=${this.errorMessage ? 'mth-nf-status' : nothing}
            ?required=${this.required}
            ?disabled=${isDisabled}
            @input=${this.handleNativeInput}
            @change=${this.handleNativeChange}
          />
          <button
            type="submit"
            class="submit"
            part="submit-button"
            ?disabled=${isDisabled}
          >
            ${resolvedSubmit}
          </button>
        </div>

        <slot></slot>

        <p
          id="mth-nf-status"
          class="status"
          part="status"
          role="status"
          aria-live="polite"
          ?data-error=${Boolean(this.errorMessage)}
          ?hidden=${!statusText}
        >
          ${statusText}
        </p>
      </form>
    `;
  }
}
