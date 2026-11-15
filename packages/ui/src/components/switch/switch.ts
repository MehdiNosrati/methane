import { UIElement, type PropertyValues } from '@methane/core';
import { FormControlController } from '@methane/primitives';
import { html, nothing } from 'lit';
import { property, query, state } from 'lit/decorators.js';
import { switchMessages } from './switch.messages.js';
import { switchStyles } from './switch.styles.js';

/**
 * `<mth-switch>`: form-associated binary toggle switch with `role="switch"`,
 * Space/Enter activation, FACE validation, same-root ARIA, and `FieldContext`.
 */
export class MthSwitch extends UIElement {
  static formAssociated = true;
  static override shadowRootOptions = { mode: 'open' as const, delegatesFocus: true };
  static override messages = switchMessages;
  static override styles = switchStyles;

  @property({ type: Boolean, reflect: true })
  checked = false;

  @property({ type: String })
  value = 'on';

  @property({ type: String, reflect: true })
  name = '';

  @property({ type: String })
  label = '';

  @property({ type: String })
  hint = '';

  @property({ type: String })
  error = '';

  @property({ type: Boolean, reflect: true })
  disabled = false;

  @property({ type: Boolean, reflect: true })
  required = false;

  @property({ type: Boolean, reflect: true })
  readonly = false;

  @state()
  private slottedDefaultText = '';

  @state()
  private slottedHintText = '';

  @state()
  private slottedErrorText = '';

  @query('#mth-switch-control')
  private controlEl!: HTMLButtonElement | null;

  private readonly formCtrl: FormControlController;
  private defaultChecked = false;
  private syncingFromFormReset = false;

  constructor() {
    super();
    this.formCtrl = new FormControlController(this, {
      internals: this.internals,
      defaultValue: '',
      messages: switchMessages,
      onValueSync: (nextValue, source) => {
        if (source === 'reset') {
          this.syncingFromFormReset = true;
          this.checked = this.defaultChecked;
          this.syncingFromFormReset = false;
          this.syncFormValue(false);
        } else {
          this.checked = nextValue.length > 0;
        }
      },
      onDisabledChange: () => {
        this.requestUpdate();
      },
      onSetCustomState: (stateName, active) => {
        this.setCustomState(stateName, active);
      },
      validator: () => {
        if (this.error.length > 0) {
          return { flags: { customError: true }, message: this.error };
        }
        return null;
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
    this.controlEl?.focus(options);
  }

  checkValidity(): boolean {
    return this.formCtrl.checkValidity();
  }

  reportValidity(): boolean {
    return this.formCtrl.reportValidity();
  }

  toggle(): void {
    if (this.formCtrl.disabled || this.formCtrl.readOnly) return;
    this.checked = !this.checked;
    this.syncFormValue(true);
    this.formCtrl.markTouched();
    this.emitEvent('mth-change', {
      detail: {
        checked: this.checked,
        value: this.checked ? this.submittedValue : '',
      },
    });
  }

  protected override onFirstConnect(): void {
    this.defaultChecked = this.hasAttribute('checked') || this.checked;
    this.formCtrl.setDefaultValue(this.defaultChecked ? this.submittedValue : '');
    this.syncFormValue(false);
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
    if (
      (changedProperties.has('checked') || changedProperties.has('value')) &&
      !this.syncingFromFormReset
    ) {
      this.syncFormValue(false);
    }
    if (changedProperties.has('error')) {
      this.formCtrl.validate();
    }

    this.setCustomState('checked', this.checked);
    this.setCustomState('required', this.formCtrl.required);
    this.setCustomState('readonly', this.formCtrl.readOnly);
  }

  private get submittedValue(): string {
    return this.value.length > 0 ? this.value : 'on';
  }

  private syncFormValue(markDirty: boolean): void {
    const nextFormVal = this.checked ? this.submittedValue : null;
    if (this.formCtrl.value !== nextFormVal || markDirty) {
      this.formCtrl.setValue(nextFormVal, { markDirty });
    }
  }

  private readonly handleControlClick = (): void => {
    this.toggle();
  };

  private readonly handleControlKeyDown = (event: KeyboardEvent): void => {
    if (event.key === ' ' || event.key === 'Enter') {
      event.preventDefault();
      this.toggle();
    }
  };

  private readonly handleControlBlur = (): void => {
    this.formCtrl.markTouched();
  };

  private handleTextSlotChange(slotName: 'default' | 'hint' | 'error', event: Event): void {
    const slot = event.target as HTMLSlotElement;
    const text = slot
      .assignedNodes({ flatten: true })
      .map((node) => node.textContent ?? '')
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim();

    if (slotName === 'default') {
      this.slottedDefaultText = text;
    } else if (slotName === 'hint') {
      this.slottedHintText = text;
    } else {
      this.slottedErrorText = text;
    }
  }

  override render() {
    const ctx = this.formCtrl.fieldContext;
    const hasFieldContext = Boolean(ctx);
    const ownLabel = this.slottedDefaultText || this.label;
    const effectiveLabel = ownLabel || ctx?.label || '';
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
        <div part="row" class="row" data-invalid=${isInvalid ? 'true' : 'false'}>
          <button
            id="mth-switch-control"
            part="control"
            class="control"
            type="button"
            role="switch"
            aria-checked=${this.checked ? 'true' : 'false'}
            aria-labelledby=${hasLabel ? 'mth-switch-label' : nothing}
            aria-label=${!hasLabel ? this.t('switchLabel') : nothing}
            aria-describedby=${hasHint && !hasError ? 'mth-switch-hint' : nothing}
            aria-errormessage=${isInvalid && hasError ? 'mth-switch-error' : nothing}
            aria-required=${isRequired ? 'true' : nothing}
            aria-readonly=${isReadonly ? 'true' : nothing}
            aria-invalid=${isInvalid ? 'true' : 'false'}
            ?disabled=${isDisabled}
            @click=${this.handleControlClick}
            @keydown=${this.handleControlKeyDown}
            @blur=${this.handleControlBlur}
          >
            <span part="thumb" class="thumb" aria-hidden="true"></span>
          </button>
          <label
            id="mth-switch-label"
            for="mth-switch-control"
            part="label"
            class=${hasFieldContext && ownLabel.length === 0 ? 'label sr-only' : 'label'}
            ?hidden=${!hasLabel}
          >
            <slot @slotchange=${(ev: Event) => this.handleTextSlotChange('default', ev)}>${effectiveLabel}</slot>
            ${isRequired && !hasFieldContext
              ? html`<span class="required-mark" aria-hidden="true">${this.t('requiredIndicator')}</span>`
              : nothing}
          </label>
        </div>
        <p
          id="mth-switch-hint"
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
          id="mth-switch-error"
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
