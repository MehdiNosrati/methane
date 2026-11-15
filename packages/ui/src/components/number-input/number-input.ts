import { UIElement, type PropertyValues } from '@methane/core';
import { FormControlController, FormattingUtils, InputController } from '@methane/primitives';
import { html, nothing } from 'lit';
import { property, query, state } from 'lit/decorators.js';
import { ifDefined } from 'lit/directives/if-defined.js';
import { numberInputMessages } from './number-input.messages.js';
import { numberInputStyles } from './number-input.styles.js';

function decimalPrecision(n: number): number {
  const s = String(n);
  const dot = s.indexOf('.');
  return dot === -1 ? 0 : s.length - dot - 1;
}

function addExact(a: number, b: number): number {
  const precision = Math.max(decimalPrecision(a), decimalPrecision(b));
  const factor = 10 ** precision;
  return Math.round((a + b) * factor) / factor;
}

/**
 * `<mth-number-input>`: form-associated spinbutton numeric input with
 * precision-safe steppers, keyboard navigation, min/max validation, and Intl formatting.
 */
export class MthNumberInput extends UIElement {
  static formAssociated = true;
  static override shadowRootOptions = { mode: 'open' as const, delegatesFocus: true };
  static override messages = numberInputMessages;
  static override styles = numberInputStyles;

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

  @property({ type: Number })
  min: number | undefined = undefined;

  @property({ type: Number })
  max: number | undefined = undefined;

  @property({ type: Number })
  step = 1;

  @property({ type: String })
  locale = 'en-US';

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

  @query('#mth-number-control')
  private controlEl!: HTMLInputElement | null;

  private readonly formCtrl: FormControlController;
  private readonly inputCtrl: InputController;

  constructor() {
    super();
    this.formCtrl = new FormControlController(this, {
      internals: this.internals,
      defaultValue: '',
      messages: numberInputMessages,
      onValueSync: (nextValue, source) => {
        const changed = this.value !== nextValue;
        this.value = nextValue;
        if (this.controlEl && this.controlEl.value !== nextValue) {
          this.controlEl.value = nextValue;
        }
        if (source === 'autofill' && changed) {
          this.emitEvent('mth-input', {
            detail: { value: nextValue, valueAsNumber: this.parseNumericValue(nextValue) },
          });
        }
      },
      onDisabledChange: () => {
        this.requestUpdate();
      },
      onSetCustomState: (stateName, active) => {
        this.setCustomState(stateName, active);
      },
      validator: ({ value }) => {
        const str = typeof value === 'string' ? value.trim() : '';
        if (this.error.length > 0) {
          return { flags: { customError: true }, message: this.error };
        }
        if (str.length === 0) return null;
        const numeric = Number(str);
        if (!Number.isFinite(numeric)) {
          return { flags: { badInput: true }, message: this.t('invalidNumber') };
        }
        if (this.min !== undefined && Number.isFinite(this.min) && numeric < this.min) {
          return {
            flags: { rangeUnderflow: true },
            message: this.t('rangeUnderflow', { min: this.min }),
          };
        }
        if (this.max !== undefined && Number.isFinite(this.max) && numeric > this.max) {
          return {
            flags: { rangeOverflow: true },
            message: this.t('rangeOverflow', { max: this.max }),
          };
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

  get valueAsNumber(): number {
    return this.parseNumericValue(this.value);
  }

  set valueAsNumber(next: number) {
    if (!Number.isFinite(next)) {
      this.value = '';
    } else {
      this.value = String(next);
    }
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

  stepUp(steps = 1): void {
    this.stepBy(steps);
  }

  stepDown(steps = 1): void {
    this.stepBy(-steps);
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
    if (
      changedProperties.has('error') ||
      changedProperties.has('min') ||
      changedProperties.has('max')
    ) {
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

  private parseNumericValue(raw: string): number {
    const trimmed = raw.trim();
    if (trimmed.length === 0) return Number.NaN;
    const n = Number(trimmed);
    return Number.isFinite(n) ? n : Number.NaN;
  }

  private clamp(n: number): number {
    let out = n;
    if (this.min !== undefined && Number.isFinite(this.min)) {
      out = Math.max(this.min, out);
    }
    if (this.max !== undefined && Number.isFinite(this.max)) {
      out = Math.min(this.max, out);
    }
    return out;
  }

  private stepBy(multiplier: number): void {
    if (this.formCtrl.disabled || this.formCtrl.readOnly) return;
    const stepSize = Number.isFinite(this.step) && this.step > 0 ? this.step : 1;
    const current = this.valueAsNumber;
    const base = Number.isFinite(current) ? current : this.min !== undefined && Number.isFinite(this.min) ? this.min : 0;
    const next = this.clamp(Number.isFinite(current) ? addExact(base, stepSize * multiplier) : multiplier >= 0 ? base : addExact(base, stepSize * multiplier));
    this.commitSteppedValue(next);
  }

  private commitSteppedValue(nextNum: number): void {
    const nextStr = String(nextNum);
    this.value = nextStr;
    if (this.controlEl) {
      this.controlEl.value = nextStr;
    }
    this.formCtrl.setValue(nextStr, { markDirty: true });
    this.formCtrl.markTouched();
    this.emitEvent('mth-input', { detail: { value: nextStr, valueAsNumber: nextNum } });
    this.emitEvent('mth-change', { detail: { value: nextStr, valueAsNumber: nextNum } });
  }

  private applyUserInputValue(nextValue: string): void {
    this.value = nextValue;
    this.formCtrl.setValue(nextValue, { markDirty: true });
    this.emitEvent('mth-input', {
      detail: { value: nextValue, valueAsNumber: this.parseNumericValue(nextValue) },
    });
  }

  private readonly handleNativeChange = (event: Event): void => {
    const target = event.target as HTMLInputElement;
    if (this.value !== target.value) {
      this.value = target.value;
      this.formCtrl.setValue(target.value, { markDirty: true });
    }
    this.emitEvent('mth-change', {
      detail: { value: target.value, valueAsNumber: this.parseNumericValue(target.value) },
    });
  };

  private readonly handleNativeBlur = (): void => {
    this.formCtrl.markTouched();
  };

  private readonly handleNativeKeydown = (event: KeyboardEvent): void => {
    if (this.inputCtrl.isComposing || this.formCtrl.disabled || this.formCtrl.readOnly) return;
    if (event.key === 'ArrowUp') {
      event.preventDefault();
      this.stepBy(1);
    } else if (event.key === 'ArrowDown') {
      event.preventDefault();
      this.stepBy(-1);
    } else if (event.key === 'PageUp') {
      event.preventDefault();
      this.stepBy(10);
    } else if (event.key === 'PageDown') {
      event.preventDefault();
      this.stepBy(-10);
    } else if (event.key === 'Home' && this.min !== undefined && Number.isFinite(this.min)) {
      event.preventDefault();
      this.commitSteppedValue(this.min);
    } else if (event.key === 'End' && this.max !== undefined && Number.isFinite(this.max)) {
      event.preventDefault();
      this.commitSteppedValue(this.max);
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

    const numeric = this.valueAsNumber;
    const hasNumeric = Number.isFinite(numeric);
    const atMin =
      hasNumeric && this.min !== undefined && Number.isFinite(this.min) && numeric <= this.min;
    const atMax =
      hasNumeric && this.max !== undefined && Number.isFinite(this.max) && numeric >= this.max;
    const valueText = hasNumeric ? FormattingUtils.formatNumber(numeric, this.locale) : undefined;

    return html`
      <div part="base" class="base">
        <label
          id="mth-number-label"
          for="mth-number-control"
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
          <button
            type="button"
            part="decrement"
            class="stepper stepper-decrement"
            tabindex="-1"
            aria-label=${this.t('decrement')}
            ?disabled=${isDisabled || isReadonly || atMin}
            @click=${() => this.stepDown()}
          >
            −
          </button>
          <input
            id="mth-number-control"
            part="control"
            class="control"
            type="text"
            inputmode="decimal"
            role="spinbutton"
            .value=${this.value}
            name=${ifDefined(this.name || undefined)}
            placeholder=${ifDefined(this.placeholder || undefined)}
            aria-label=${!hasLabel ? this.t('defaultLabel') : nothing}
            aria-valuenow=${hasNumeric ? String(numeric) : nothing}
            aria-valuetext=${valueText !== undefined ? valueText : nothing}
            aria-valuemin=${this.min !== undefined && Number.isFinite(this.min) ? String(this.min) : nothing}
            aria-valuemax=${this.max !== undefined && Number.isFinite(this.max) ? String(this.max) : nothing}
            ?disabled=${isDisabled}
            ?required=${isRequired}
            ?readonly=${isReadonly}
            aria-invalid=${isInvalid ? 'true' : 'false'}
            aria-describedby=${hasHint && !hasError ? 'mth-number-hint' : nothing}
            aria-errormessage=${isInvalid && hasError ? 'mth-number-error' : nothing}
            @change=${this.handleNativeChange}
            @blur=${this.handleNativeBlur}
            @keydown=${this.handleNativeKeydown}
          />
          <button
            type="button"
            part="increment"
            class="stepper stepper-increment"
            tabindex="-1"
            aria-label=${this.t('increment')}
            ?disabled=${isDisabled || isReadonly || atMax}
            @click=${() => this.stepUp()}
          >
            +
          </button>
        </div>
        <p
          id="mth-number-hint"
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
          id="mth-number-error"
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
