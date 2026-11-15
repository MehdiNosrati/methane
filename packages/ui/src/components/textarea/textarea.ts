import { UIElement, type PropertyValues } from '@methane/core';
import { FormControlController, InputController } from '@methane/primitives';
import { html, nothing } from 'lit';
import { property, query, state } from 'lit/decorators.js';
import { ifDefined } from 'lit/directives/if-defined.js';
import { textareaMessages } from './textarea.messages.js';
import { textareaStyles } from './textarea.styles.js';

export type MthTextareaResize = 'none' | 'vertical' | 'both';

/**
 * `<mth-textarea>`: form-associated multi-line text control with auto-resize
 * (via adopted `CSSStyleSheet`), character counter, FACE validation, IME-safe
 * `InputController`, and `FieldContext` integration.
 */
export class MthTextarea extends UIElement {
  static formAssociated = true;
  static override shadowRootOptions = { mode: 'open' as const, delegatesFocus: true };
  static override messages = textareaMessages;
  static override styles = textareaStyles;

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

  @property({ type: Number, reflect: true })
  rows = 3;

  @property({ type: Boolean, attribute: 'auto-resize', reflect: true })
  autoResize = false;

  @property({ type: Number })
  maxlength: number | null = null;

  @property({ type: Number })
  minlength: number | null = null;

  @property({ type: String, reflect: true })
  resize: MthTextareaResize = 'vertical';

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

  @query('#mth-textarea-control')
  private controlEl!: HTMLTextAreaElement | null;

  private readonly formCtrl: FormControlController;
  private readonly inputCtrl: InputController;
  private autoResizeSheet: CSSStyleSheet | null = null;

  constructor() {
    super();
    this.formCtrl = new FormControlController(this, {
      internals: this.internals,
      defaultValue: '',
      messages: textareaMessages,
      onValueSync: (nextValue) => {
        this.value = nextValue;
        this.syncControlElementValue(nextValue);
        this.syncAutoResizeSheet();
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
        if (
          this.minlength !== null &&
          this.minlength > 0 &&
          str.length > 0 &&
          str.length < this.minlength
        ) {
          return {
            flags: { tooShort: true },
            message: this.t('tooShort', { min: this.minlength }),
          };
        }
        if (this.maxlength !== null && this.maxlength >= 0 && str.length > this.maxlength) {
          return {
            flags: { tooLong: true },
            message: this.t('tooLong', { max: this.maxlength }),
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
      this.syncControlElementValue(this.value);
    }
    if (
      changedProperties.has('error') ||
      changedProperties.has('minlength') ||
      changedProperties.has('maxlength')
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
    if (
      changedProperties.has('autoResize') ||
      changedProperties.has('value') ||
      changedProperties.has('rows')
    ) {
      this.syncAutoResizeSheet();
    }
  }

  private applyUserInputValue(nextValue: string): void {
    this.value = nextValue;
    this.formCtrl.setValue(nextValue, { markDirty: true });
    this.syncAutoResizeSheet();
    this.emitEvent('mth-input', { detail: { value: nextValue } });
  }

  private syncControlElementValue(nextValue: string): void {
    if (this.controlEl && this.controlEl.value !== nextValue) {
      this.controlEl.value = nextValue;
    }
  }

  private syncAutoResizeSheet(): void {
    const root = this.shadowRoot;
    if (!root || !('adoptedStyleSheets' in root) || typeof CSSStyleSheet === 'undefined') {
      return;
    }
    if (!this.autoResize || !this.controlEl) {
      if (this.autoResizeSheet) {
        root.adoptedStyleSheets = root.adoptedStyleSheets.filter(
          (sheet) => sheet !== this.autoResizeSheet,
        );
      }
      return;
    }

    if (!this.autoResizeSheet) {
      this.autoResizeSheet = new CSSStyleSheet();
    }
    if (typeof this.autoResizeSheet.replaceSync !== 'function') {
      return;
    }
    // Reset to auto via sheet before reading scrollHeight so shrinking works without inline style attributes.
    this.autoResizeSheet.replaceSync(':host { --_ta-auto-height: auto; }');
    if (!root.adoptedStyleSheets.includes(this.autoResizeSheet)) {
      root.adoptedStyleSheets = [...root.adoptedStyleSheets, this.autoResizeSheet];
    }
    const scrollHeight = this.controlEl.scrollHeight;
    if (scrollHeight > 0) {
      this.autoResizeSheet.replaceSync(`:host { --_ta-auto-height: ${scrollHeight}px; }`);
    }
  }

  private readonly handleNativeChange = (event: Event): void => {
    const target = event.target as HTMLTextAreaElement;
    if (this.value !== target.value) {
      this.value = target.value;
      this.formCtrl.setValue(target.value, { markDirty: true });
      this.syncAutoResizeSheet();
    }
    this.emitEvent('mth-change', { detail: { value: target.value } });
  };

  private readonly handleNativeBlur = (): void => {
    this.formCtrl.markTouched();
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
    const hasCounter = this.maxlength !== null && this.maxlength >= 0;
    const isRequired = this.formCtrl.required;
    const isDisabled = this.formCtrl.disabled;
    const isReadonly = this.formCtrl.readOnly;
    const isInvalid = this.formCtrl.userInvalid || explicitError.length > 0;

    const describedByIds: string[] = [];
    if (hasHint && !hasError) {
      describedByIds.push('mth-textarea-hint');
    }
    if (hasCounter) {
      describedByIds.push('mth-textarea-count');
    }
    const describedBy = describedByIds.length > 0 ? describedByIds.join(' ') : undefined;

    return html`
      <div part="base" class="base">
        <label
          id="mth-textarea-label"
          for="mth-textarea-control"
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
          <textarea
            id="mth-textarea-control"
            part="control"
            class="control"
            data-resize=${this.autoResize ? 'none' : this.resize}
            .value=${this.value}
            name=${ifDefined(this.name || undefined)}
            placeholder=${ifDefined(this.placeholder || undefined)}
            rows=${this.rows}
            maxlength=${ifDefined(hasCounter ? this.maxlength! : undefined)}
            minlength=${ifDefined(this.minlength !== null && this.minlength > 0 ? this.minlength : undefined)}
            ?disabled=${isDisabled}
            ?required=${isRequired}
            ?readonly=${isReadonly}
            aria-invalid=${isInvalid ? 'true' : 'false'}
            aria-describedby=${ifDefined(describedBy)}
            aria-errormessage=${isInvalid && hasError ? 'mth-textarea-error' : nothing}
            @change=${this.handleNativeChange}
            @blur=${this.handleNativeBlur}
          ></textarea>
        </div>
        <div part="footer" class="footer">
          <div class="messages">
            <p
              id="mth-textarea-hint"
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
              id="mth-textarea-error"
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
          <span
            id="mth-textarea-count"
            part="count"
            class="count"
            ?hidden=${!hasCounter}
          >${hasCounter
            ? this.t('characterCountLimit', { count: this.value.length, max: this.maxlength! })
            : ''}</span>
        </div>
      </div>
    `;
  }
}
