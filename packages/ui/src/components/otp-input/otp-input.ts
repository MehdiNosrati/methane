import { UIElement, type PropertyValues } from '@methane/core';
import {
  FormControlController,
  InputController,
  RovingFocusController,
} from '@methane/primitives';
import { html, nothing } from 'lit';
import { property, state } from 'lit/decorators.js';
import { ifDefined } from 'lit/directives/if-defined.js';
import { otpInputMessages } from './otp-input.messages.js';
import { otpInputStyles } from './otp-input.styles.js';

/**
 * `<mth-otp-input>`: form-associated segmented verification code input with
 * paste distribution, roving keyboard focus, and `autocomplete="one-time-code"`.
 */
export class MthOtpInput extends UIElement {
  static formAssociated = true;
  static override shadowRootOptions = { mode: 'open' as const, delegatesFocus: true };
  static override messages = otpInputMessages;
  static override styles = otpInputStyles;

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

  @property({ type: Number })
  length = 6;

  @property({ type: Boolean, reflect: true })
  alphanumeric = false;

  @property({ type: Boolean, reflect: true })
  masked = false;

  @property({ type: String })
  autocomplete = 'one-time-code';

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

  private readonly formCtrl: FormControlController;
  private readonly inputCtrl: InputController;
  private readonly rovingFocus: RovingFocusController;

  constructor() {
    super();
    this.formCtrl = new FormControlController(this, {
      internals: this.internals,
      defaultValue: '',
      messages: otpInputMessages,
      onValueSync: (nextValue, source) => {
        const sanitized = this.sanitizeString(nextValue);
        const changed = this.value !== sanitized;
        this.value = sanitized;
        if (source === 'autofill' && changed) {
          this.emitEvent('mth-input', { detail: { value: sanitized } });
          if (sanitized.length === this.cellCount) {
            this.emitEvent('mth-complete', { detail: { value: sanitized } });
          }
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
        if (str.length > 0 && str.length < this.cellCount) {
          return {
            flags: { tooShort: true },
            message: this.t('incompleteCode', { length: this.cellCount }),
          };
        }
        return null;
      },
    });

    this.inputCtrl = new InputController(this, {
      onCommitValue: () => {
        // Handled per-cell via distribute/input handlers below.
      },
    });

    this.rovingFocus = new RovingFocusController(this, {
      orientation: 'horizontal',
      loop: false,
      getItems: () => this.getCells(),
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

  private get cellCount(): number {
    return Number.isFinite(this.length) && this.length > 0 ? Math.floor(this.length) : 6;
  }

  override focus(options?: FocusOptions): void {
    const cells = this.getCells();
    const target = cells.find((c) => c.tabIndex === 0) ?? cells[0];
    target?.focus(options);
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
      const normalized = this.sanitizeString(this.value);
      if (normalized !== this.value) {
        this.value = normalized;
      }
      if (this.formCtrl.value !== normalized) {
        this.formCtrl.setValue(normalized, { markDirty: false });
      }
    }
    if (changedProperties.has('error') || changedProperties.has('length')) {
      this.formCtrl.validate();
    }

    this.setCustomState('required', this.formCtrl.required);
    this.setCustomState('readonly', this.formCtrl.readOnly);
  }

  protected override updated(changedProperties: PropertyValues): void {
    super.updated(changedProperties);
    const cells = this.getCells();
    if (cells.length > 0) {
      this.inputCtrl.bind(cells[0]!);
    }
    this.rovingFocus.syncTabIndices();
  }

  private getCells(): HTMLInputElement[] {
    if (!this.shadowRoot) return [];
    return Array.from(this.shadowRoot.querySelectorAll<HTMLInputElement>('input[part="cell"]'));
  }

  private sanitizeString(raw: string): string {
    const pattern = this.alphanumeric ? /[a-zA-Z0-9]/g : /\d/g;
    const matches = raw.match(pattern);
    return matches ? matches.join('').slice(0, this.cellCount) : '';
  }

  private commitCellsValue(nextChars: string[]): void {
    const nextValue = nextChars.join('').slice(0, this.cellCount);
    const prevValue = this.value;
    this.value = nextValue;
    this.formCtrl.setValue(nextValue, { markDirty: true });
    this.emitEvent('mth-input', { detail: { value: nextValue } });
    if (nextValue !== prevValue && nextValue.length === this.cellCount) {
      this.emitEvent('mth-complete', { detail: { value: nextValue } });
    }
  }

  private getCharsArray(): string[] {
    const count = this.cellCount;
    const out: string[] = [];
    for (let i = 0; i < count; i += 1) {
      out.push(this.value[i] ?? '');
    }
    return out;
  }

  private readonly handleCellInput = (index: number, event: Event): void => {
    if (this.formCtrl.disabled || this.formCtrl.readOnly) return;
    const input = event.target as HTMLInputElement;
    const sanitized = this.sanitizeString(input.value);
    const chars = this.getCharsArray();

    if (sanitized.length === 0) {
      chars[index] = '';
      input.value = '';
      this.commitCellsValue(chars);
      return;
    }

    if (sanitized.length > 1) {
      for (let offset = 0; offset < sanitized.length && index + offset < this.cellCount; offset += 1) {
        chars[index + offset] = sanitized[offset]!;
      }
      this.commitCellsValue(chars);
      const nextIdx = Math.min(index + sanitized.length, this.cellCount - 1);
      this.rovingFocus.setActiveIndex(nextIdx, true);
      return;
    }

    chars[index] = sanitized;
    input.value = sanitized;
    this.commitCellsValue(chars);
    if (index + 1 < this.cellCount) {
      this.rovingFocus.setActiveIndex(index + 1, true);
    }
  };

  private readonly handleCellPaste = (index: number, event: ClipboardEvent): void => {
    if (this.formCtrl.disabled || this.formCtrl.readOnly) return;
    const raw = event.clipboardData?.getData('text') ?? '';
    const sanitized = this.sanitizeString(raw);
    if (sanitized.length === 0) return;
    event.preventDefault();
    const chars = this.getCharsArray();
    for (let offset = 0; offset < sanitized.length && index + offset < this.cellCount; offset += 1) {
      chars[index + offset] = sanitized[offset]!;
    }
    this.commitCellsValue(chars);
    const nextIdx = Math.min(index + sanitized.length, this.cellCount - 1);
    this.rovingFocus.setActiveIndex(nextIdx, true);
  };

  private readonly handleCellKeydown = (index: number, event: KeyboardEvent): void => {
    if (this.formCtrl.disabled || this.formCtrl.readOnly) return;
    if (event.key === 'Backspace') {
      const chars = this.getCharsArray();
      if (!chars[index] && index > 0) {
        event.preventDefault();
        chars[index - 1] = '';
        this.commitCellsValue(chars);
        this.rovingFocus.setActiveIndex(index - 1, true);
      }
    }
  };

  private readonly handleCellsFocusOut = (event: FocusEvent): void => {
    const related = event.relatedTarget as Node | null;
    if (!related || !this.shadowRoot?.contains(related)) {
      this.formCtrl.markTouched();
      this.emitEvent('mth-change', { detail: { value: this.value } });
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
    const total = this.cellCount;
    const chars = this.getCharsArray();

    return html`
      <div part="base" class="base">
        <span
          id="mth-otp-label"
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
        </span>
        <div
          part="cells"
          class="cells"
          role="group"
          aria-labelledby=${hasLabel ? 'mth-otp-label' : nothing}
          aria-label=${!hasLabel ? this.t('defaultLabel') : nothing}
          aria-describedby=${hasHint && !hasError ? 'mth-otp-hint' : nothing}
          data-invalid=${isInvalid ? 'true' : 'false'}
          @focusout=${this.handleCellsFocusOut}
        >
          ${chars.map(
            (char, idx) => html`
              <input
                part="cell"
                class="cell"
                type=${this.masked ? 'password' : 'text'}
                inputmode=${this.alphanumeric ? 'text' : 'numeric'}
                maxlength=${idx === 0 ? total : 1}
                autocomplete=${idx === 0 ? ifDefined(this.autocomplete || undefined) : 'off'}
                .value=${char}
                aria-label=${this.t('cellLabel', { index: idx + 1, total })}
                aria-invalid=${isInvalid ? 'true' : 'false'}
                ?disabled=${isDisabled}
                ?readonly=${isReadonly}
                @input=${(ev: Event) => this.handleCellInput(idx, ev)}
                @paste=${(ev: ClipboardEvent) => this.handleCellPaste(idx, ev)}
                @keydown=${(ev: KeyboardEvent) => this.handleCellKeydown(idx, ev)}
              />
            `,
          )}
        </div>
        <p
          id="mth-otp-hint"
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
          id="mth-otp-error"
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
