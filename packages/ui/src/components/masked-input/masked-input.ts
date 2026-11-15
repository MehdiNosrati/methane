import { UIElement, type PropertyValues } from '@methane-ui/core';
import { FormControlController, InputController, MaskAndFormatEngine } from '@methane-ui/primitives';
import { html, nothing } from 'lit';
import { property, query, state } from 'lit/decorators.js';
import { ifDefined } from 'lit/directives/if-defined.js';
import { maskedInputMessages } from './masked-input.messages.js';
import { maskedInputStyles } from './masked-input.styles.js';

/**
 * `<mth-masked-input>`: form-associated pattern-masked input powered by `MaskAndFormatEngine`.
 */
export class MthMaskedInput extends UIElement {
  static formAssociated = true;
  static override shadowRootOptions = { mode: 'open' as const, delegatesFocus: true };
  static override messages = maskedInputMessages;
  static override styles = maskedInputStyles;

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
  autocomplete = '';

  @property({ type: String })
  mask = '0000-0000';

  @property({ type: Boolean, attribute: 'unmask-on-submit', reflect: true })
  unmaskOnSubmit = false;

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

  @query('#mth-masked-control')
  private controlEl!: HTMLInputElement | null;

  private readonly formCtrl: FormControlController;
  private readonly inputCtrl: InputController;
  private readonly maskEngine: MaskAndFormatEngine;
  private prevControlValue = '';

  constructor() {
    super();
    this.maskEngine = new MaskAndFormatEngine(
      { mode: 'pattern', pattern: this.mask, definitions: { '#': /\d/ } },
      null,
    );

    this.formCtrl = new FormControlController(this, {
      internals: this.internals,
      defaultValue: '',
      messages: maskedInputMessages,
      onValueSync: (nextValue, source) => {
        const res = nextValue.length > 0 ? this.maskEngine.format(nextValue) : null;
        const formatted = res ? res.formatted : '';
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
          return {
            flags: { patternMismatch: true },
            message: this.t('incompleteMask', { mask: this.mask }),
          };
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
    return this.value.length > 0 ? this.maskEngine.format(this.value).unmasked : '';
  }

  get complete(): boolean {
    return this.value.length > 0 && this.maskEngine.format(this.value).isComplete;
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
    this.syncFormSubmissionValue(this.value, false);
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
    if (changedProperties.has('value') || changedProperties.has('unmaskOnSubmit')) {
      this.syncFormSubmissionValue(this.value, false);
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

  private syncFormSubmissionValue(formatted: string, markDirty: boolean): void {
    const submitted = this.unmaskOnSubmit
      ? formatted.length > 0
        ? this.maskEngine.format(formatted).unmasked
        : ''
      : formatted;
    if (this.formCtrl.value !== submitted) {
      this.formCtrl.setValue(submitted, { markDirty });
    }
  }

  private buildDetail(formatted: string): { value: string; unmasked: string; complete: boolean } {
    const res = formatted.length > 0 ? this.maskEngine.format(formatted) : null;
    return {
      value: formatted,
      unmasked: res ? res.unmasked : '',
      complete: res ? res.isComplete : false,
    };
  }

  private applyMaskedInput(): void {
    if (!this.controlEl) return;
    const res = this.maskEngine.applyInput(this.controlEl, this.prevControlValue);
    this.prevControlValue = res.formatted;
    this.value = res.formatted;
    this.syncFormSubmissionValue(res.formatted, true);
    this.emitEvent('mth-input', {
      detail: { value: res.formatted, unmasked: res.unmasked, complete: res.isComplete },
    });
  }

  private readonly handleNativeChange = (event: Event): void => {
    const target = event.target as HTMLInputElement;
    const res = target.value.length > 0 ? this.maskEngine.format(target.value) : null;
    const formatted = res ? res.formatted : '';
    if (this.value !== formatted) {
      this.value = formatted;
      this.prevControlValue = formatted;
      this.syncFormSubmissionValue(formatted, true);
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
          id="mth-masked-label"
          for="mth-masked-control"
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
            id="mth-masked-control"
            part="control"
            class="control"
            type="text"
            .value=${this.value}
            name=${ifDefined(this.name || undefined)}
            placeholder=${ifDefined(this.placeholder || undefined)}
            autocomplete=${ifDefined(this.autocomplete || undefined)}
            aria-label=${!hasLabel ? this.t('defaultLabel') : nothing}
            ?disabled=${isDisabled}
            ?required=${isRequired}
            ?readonly=${isReadonly}
            aria-invalid=${isInvalid ? 'true' : 'false'}
            aria-describedby=${hasHint && !hasError ? 'mth-masked-hint' : nothing}
            aria-errormessage=${isInvalid && hasError ? 'mth-masked-error' : nothing}
            @change=${this.handleNativeChange}
            @blur=${this.handleNativeBlur}
            @keydown=${this.handleNativeKeydown}
          />
          <slot name="suffix"></slot>
        </div>
        <p
          id="mth-masked-hint"
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
          id="mth-masked-error"
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
