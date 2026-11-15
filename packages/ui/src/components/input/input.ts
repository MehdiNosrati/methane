import { UIElement, type PropertyValues } from '@methane-ui/core';
import { FormControlController, InputController } from '@methane-ui/primitives';
import { html, nothing } from 'lit';
import { property, query, state } from 'lit/decorators.js';
import { ifDefined } from 'lit/directives/if-defined.js';
import { inputMessages } from './input.messages.js';
import { inputStyles } from './input.styles.js';

export type MthInputType = 'text' | 'email' | 'url' | 'search' | 'tel' | 'password';

/**
 * `<mth-input>`: form-associated textual input with strict same-root shadow ARIA,
 * FACE validation (`FormControlController`), IME-safe `InputController`,
 * Community Context Protocol (`FIELD_CONTEXT`), and progressive Light-DOM
 * `<input slot="input">` autofill compatibility (ADR-003).
 */
export class MthInput extends UIElement {
  static formAssociated = true;
  static override shadowRootOptions = { mode: 'open' as const, delegatesFocus: true };
  static override messages = inputMessages;
  static override styles = inputStyles;

  @property({ type: String })
  value = '';

  @property({ type: String, reflect: true })
  name = '';

  @property({ type: String, reflect: true })
  type: MthInputType = 'text';

  @property({ type: String })
  label = '';

  @property({ type: String })
  hint = '';

  @property({ type: String })
  error = '';

  @property({ type: String })
  placeholder = '';

  @property({ type: String })
  autocomplete = '';

  @property({ type: String })
  inputmode = '';

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

  @state()
  private hasSlottedInput = false;

  @query('#mth-input-control')
  private controlEl!: HTMLInputElement | null;

  private slottedInputEl: HTMLInputElement | null = null;

  private readonly formCtrl: FormControlController;
  private readonly inputCtrl: InputController;

  constructor() {
    super();
    this.formCtrl = new FormControlController(this, {
      internals: this.internals,
      defaultValue: '',
      messages: inputMessages,
      onValueSync: (nextValue, source) => {
        const changed = this.value !== nextValue;
        this.value = nextValue;
        this.syncControlElementValue(nextValue);
        if (source === 'autofill' && changed) {
          this.emitEvent('mth-input', { detail: { value: nextValue } });
        }
      },
      onDisabledChange: () => {
        this.syncSlottedInputAttributes();
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
        if (str.length > 0 && this.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(str)) {
          return {
            flags: { typeMismatch: true },
            message: this.t('typeMismatchEmail'),
          };
        }
        if (str.length > 0 && this.type === 'url') {
          try {
            new URL(str);
          } catch {
            return {
              flags: { typeMismatch: true },
              message: this.t('typeMismatchUrl'),
            };
          }
        }
        return null;
      },
    });

    this.inputCtrl = new InputController(this, {
      onCommitValue: (nextValue) => {
        this.applyUserInputValue(nextValue);
      },
    });
  }

  get validity(): ValidityState | undefined {
    return this.internals?.validity;
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

  override focus(options?: FocusOptions): void {
    if (this.slottedInputEl) {
      this.slottedInputEl.focus(options);
      return;
    }
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

  override disconnectedCallback(): void {
    this.detachSlottedInputListeners();
    super.disconnectedCallback();
  }

  protected override onFormDisabled(disabled: boolean): void {
    this.formCtrl.handleFormDisabled(disabled);
    this.syncSlottedInputAttributes();
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
      this.syncControlElementValue(this.value);
    }
    if (changedProperties.has('error')) {
      this.formCtrl.validate();
    }

    const isRequired = this.formCtrl.required;
    const isReadonly = this.formCtrl.readOnly;
    this.setCustomState('required', isRequired);
    this.setCustomState('readonly', isReadonly);
  }

  protected override updated(changedProperties: PropertyValues): void {
    super.updated(changedProperties);
    if (!this.hasSlottedInput && this.controlEl) {
      this.inputCtrl.bind(this.controlEl);
      if (this.controlEl.value !== this.value) {
        this.controlEl.value = this.value;
      }
    }
    this.syncSlottedInputAttributes();
  }

  private applyUserInputValue(nextValue: string): void {
    if (this.slottedInputEl && this.value === nextValue) return;
    this.value = nextValue;
    this.formCtrl.setValue(nextValue, { markDirty: true });
    this.emitEvent('mth-input', { detail: { value: nextValue } });
  }

  private syncControlElementValue(nextValue: string): void {
    if (this.controlEl && this.controlEl.value !== nextValue) {
      this.controlEl.value = nextValue;
    }
    if (this.slottedInputEl && this.slottedInputEl.value !== nextValue) {
      this.slottedInputEl.value = nextValue;
    }
  }

  private syncSlottedInputAttributes(): void {
    const el = this.slottedInputEl;
    if (!el) return;
    el.disabled = this.formCtrl.disabled;
    el.required = this.formCtrl.required;
    el.readOnly = this.formCtrl.readOnly;
    if (el.value !== this.value) {
      el.value = this.value;
    }
    const effectiveLabel =
      this.slottedLabelText || this.label || this.formCtrl.fieldContext?.label || '';
    if (
      effectiveLabel.length > 0 &&
      !el.hasAttribute('aria-label') &&
      !el.hasAttribute('aria-labelledby') &&
      (!el.labels || el.labels.length === 0)
    ) {
      el.setAttribute('aria-label', effectiveLabel);
    }
  }

  private detachSlottedInputListeners(): void {
    if (!this.slottedInputEl) return;
    this.slottedInputEl.removeEventListener('change', this.handleNativeChange);
    this.slottedInputEl.removeEventListener('keydown', this.handleNativeKeydown);
    this.slottedInputEl.removeEventListener('blur', this.handleNativeBlur);
    this.slottedInputEl = null;
  }

  private readonly handleInputSlotChange = (event: Event): void => {
    const slot = event.target as HTMLSlotElement;
    const assigned = slot
      .assignedElements({ flatten: true })
      .find((node): node is HTMLInputElement => node instanceof HTMLInputElement);

    if (assigned === this.slottedInputEl) return;
    this.detachSlottedInputListeners();

    if (assigned) {
      this.slottedInputEl = assigned;
      this.hasSlottedInput = true;
      this.inputCtrl.bind(assigned);
      assigned.addEventListener('change', this.handleNativeChange);
      assigned.addEventListener('keydown', this.handleNativeKeydown);
      assigned.addEventListener('blur', this.handleNativeBlur);
      if (assigned.value && !this.value) {
        this.value = assigned.value;
        this.formCtrl.setValue(assigned.value, { markDirty: false });
      } else {
        this.syncSlottedInputAttributes();
      }
    } else {
      this.hasSlottedInput = false;
      if (this.controlEl) {
        this.inputCtrl.bind(this.controlEl);
      }
    }
  };

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
          id="mth-input-label"
          for="mth-input-control"
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
          <slot name="input" @slotchange=${this.handleInputSlotChange}>
            <input
              id="mth-input-control"
              part="control"
              class="control"
              .value=${this.value}
              type=${this.type}
              name=${ifDefined(this.name || undefined)}
              placeholder=${ifDefined(this.placeholder || undefined)}
              autocomplete=${ifDefined(this.autocomplete || undefined)}
              inputmode=${ifDefined(this.inputmode || undefined)}
              ?disabled=${isDisabled}
              ?required=${isRequired}
              ?readonly=${isReadonly}
              aria-invalid=${isInvalid ? 'true' : 'false'}
              aria-describedby=${hasHint && !hasError ? 'mth-input-hint' : nothing}
              aria-errormessage=${isInvalid && hasError ? 'mth-input-error' : nothing}
              @change=${this.handleNativeChange}
              @blur=${this.handleNativeBlur}
              @keydown=${this.handleNativeKeydown}
            />
          </slot>
          <slot name="suffix"></slot>
        </div>
        <p
          id="mth-input-hint"
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
          id="mth-input-error"
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
