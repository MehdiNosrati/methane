import {
  UIElement,
  html,
  nothing,
  property,
  query,
  type PropertyValues,
} from '@methane/core';
import { FormControlController, InputController } from '@methane/primitives';
import { promptInputMessages } from './prompt-input.messages.js';
import { promptInputStyles } from './prompt-input.styles.js';

/**
 * `<mth-prompt-input>`: FACE-integrated AI prompt composer with IME-safe
 * `InputController`, auto-sizing height sheet, Enter/Mod+Enter submit, and stop control.
 */
export class MthPromptInput extends UIElement {
  static formAssociated = true;
  static override shadowRootOptions = { mode: 'open' as const, delegatesFocus: true };
  static override messages = promptInputMessages;
  static override styles = promptInputStyles;

  @property({ type: String })
  value = '';

  @property({ type: String, reflect: true })
  name = '';

  @property({ type: String })
  label = '';

  @property({ type: String })
  placeholder = '';

  @property({ type: String })
  hint = '';

  @property({ type: String })
  error = '';

  @property({ type: Boolean, reflect: true })
  disabled = false;

  @property({ type: Boolean, reflect: true })
  required = false;

  @property({ type: Boolean, reflect: true })
  streaming = false;

  @property({ type: Boolean, attribute: 'submit-on-enter' })
  submitOnEnter = true;

  @property({ type: Number, attribute: 'max-rows' })
  maxRows = 6;

  @query('.textarea')
  private textareaEl!: HTMLTextAreaElement | null;

  private readonly formCtrl: FormControlController;
  private readonly inputCtrl: InputController;
  private sizeSheet: CSSStyleSheet | null = null;

  constructor() {
    super();

    this.formCtrl = new FormControlController(this, {
      internals: this.internals,
      defaultValue: '',
      required: this.required,
      disabled: this.disabled,
      messages: promptInputMessages,
      onValueSync: (nextVal) => {
        this.value = nextVal;
        if (this.textareaEl && this.textareaEl.value !== nextVal) {
          this.textareaEl.value = nextVal;
        }
        this.syncStates();
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

  get validity(): ValidityState | undefined {
    return this.internals?.validity;
  }

  get validationMessage(): string {
    return this.formCtrl.validationMessage;
  }

  get effectivelyDisabled(): boolean {
    return this.formCtrl.disabled;
  }

  get dirty(): boolean {
    return this.formCtrl.dirty;
  }

  get touched(): boolean {
    return this.formCtrl.touched;
  }

  get invalid(): boolean {
    return this.formCtrl.invalid;
  }

  override focus(options?: FocusOptions): void {
    this.textareaEl?.focus(options);
  }

  checkValidity(): boolean {
    return this.formCtrl.checkValidity(this.textareaEl ?? undefined);
  }

  reportValidity(): boolean {
    return this.formCtrl.reportValidity(this.textareaEl ?? undefined);
  }

  submit(): boolean {
    if (this.effectivelyDisabled) return false;
    if (!this.reportValidity()) {
      this.formCtrl.markTouched();
      this.syncStates();
      return false;
    }
    if (!this.value.trim()) {
      return false;
    }
    const allowed = this.emitEvent('mth-submit', {
      detail: { value: this.value },
      cancelable: true,
    });
    return allowed;
  }

  stop(): void {
    this.emitEvent('mth-stop');
  }

  protected override onFirstConnect(): void {
    this.formCtrl.setDefaultValue(this.getAttribute('value') ?? this.value ?? '');
    this.formCtrl.setValue(this.value, { markDirty: false });
    this.syncStates();
  }

  protected override onFormDisabled(disabled: boolean): void {
    this.formCtrl.handleFormDisabled(disabled);
    this.syncStates();
    this.requestUpdate();
  }

  protected override onFormReset(): void {
    this.formCtrl.handleFormReset();
    this.syncStates();
  }

  protected override onFormStateRestore(
    state: File | string | FormData | null,
    mode: 'restore' | 'autocomplete',
  ): void {
    this.formCtrl.handleFormStateRestore(state, mode);
    this.syncStates();
  }

  protected override willUpdate(changedProperties: PropertyValues): void {
    super.willUpdate(changedProperties);
    if (changedProperties.has('value')) {
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
        this.textareaEl ?? undefined,
      );
    }
    this.syncStates();
  }

  protected override updated(changedProperties: PropertyValues): void {
    super.updated(changedProperties);
    this.inputCtrl.bind(this.textareaEl);
    if (this.textareaEl && this.textareaEl.value !== this.value) {
      this.textareaEl.value = this.value;
    }
    if (changedProperties.has('value') || changedProperties.has('maxRows')) {
      this.syncAutoSizeSheet();
    }
  }

  private syncStates(): void {
    this.setCustomState('streaming', this.streaming);
    this.setCustomState('empty', this.value.length === 0);
    this.setCustomState('disabled', this.effectivelyDisabled);
  }

  private syncAutoSizeSheet(): void {
    const el = this.textareaEl;
    const root = this.shadowRoot;
    if (!el || !root || typeof CSSStyleSheet === 'undefined' || !('adoptedStyleSheets' in root)) {
      return;
    }
    if (!this.sizeSheet) {
      this.sizeSheet = new CSSStyleSheet();
    }
    if (!root.adoptedStyleSheets.includes(this.sizeSheet)) {
      root.adoptedStyleSheets = [...root.adoptedStyleSheets, this.sizeSheet];
    }
    const lineHeightPx = 24;
    const safeMaxRows = Number.isFinite(this.maxRows) ? Math.max(1, Math.trunc(this.maxRows)) : 8;
    const rows = Math.max(1, Math.min(safeMaxRows, this.value.split('\n').length));
    const scrollH = el.scrollHeight > 0 ? el.scrollHeight : rows * lineHeightPx;
    const maxH = safeMaxRows * lineHeightPx;
    const clamped = Math.min(Math.max(40, scrollH), maxH);
    this.sizeSheet.replaceSync(`:host { --_pi-block-size: ${clamped}px; }`);
  }

  private applyValueInput(nextVal: string): void {
    this.value = nextVal;
    this.formCtrl.setValue(nextVal, { markDirty: true });
    this.syncStates();
    this.syncAutoSizeSheet();
    this.emitEvent('mth-input', { detail: { value: nextVal } });
  }

  private readonly handleTextareaInput = (event: Event): void => {
    if (this.inputCtrl.isComposing) return;
    const target = event.target as HTMLTextAreaElement;
    this.applyValueInput(target.value);
  };

  private readonly handleTextareaChange = (): void => {
    this.formCtrl.markTouched();
    this.syncStates();
    this.emitEvent('mth-change', { detail: { value: this.value } });
  };

  private readonly handleTextareaBlur = (): void => {
    this.formCtrl.markTouched();
    this.formCtrl.validate(this.textareaEl ?? undefined);
    this.syncStates();
  };

  private readonly handleKeyDown = (event: KeyboardEvent): void => {
    if (this.inputCtrl.isComposing || event.isComposing) {
      return;
    }
    if (event.key !== 'Enter') {
      return;
    }
    const mod = event.metaKey || event.ctrlKey;
    if ((this.submitOnEnter && !event.shiftKey && !mod) || (!this.submitOnEnter && mod)) {
      event.preventDefault();
      this.submit();
    }
  };

  private readonly handleSubmitClick = (): void => {
    this.submit();
  };

  private readonly handleStopClick = (): void => {
    this.stop();
  };

  override render() {
    const resolvedLabel =
      this.label || this.formCtrl.fieldContext?.label || this.t('label');
    const resolvedPlaceholder = this.placeholder || this.t('placeholder');
    const resolvedHint =
      this.hint ||
      this.formCtrl.fieldContext?.hint ||
      (this.submitOnEnter ? this.t('hintText') : this.t('modEnterHintText'));
    const resolvedError =
      this.error ||
      this.formCtrl.fieldContext?.error ||
      (this.formCtrl.invalid && (this.formCtrl.touched || this.formCtrl.dirty)
        ? this.formCtrl.validationMessage
        : '');

    const inputId = 'mth-pi-textarea';
    const labelId = 'mth-pi-label';
    const hintId = 'mth-pi-hint';
    const errorId = 'mth-pi-error';
    const describedBy =
      [resolvedHint ? hintId : '', resolvedError ? errorId : ''].filter(Boolean).join(' ') ||
      undefined;
    const isDisabled = this.effectivelyDisabled;
    const canSend = !isDisabled && this.value.trim().length > 0;

    return html`
      <div class="container" part="base">
        <label id=${labelId} class="label" part="label" for=${inputId}>
          ${resolvedLabel}
        </label>

        <div class="composer" part="composer">
          <slot name="attachments"></slot>
          <textarea
            id=${inputId}
            class="textarea"
            part="textarea"
            rows="2"
            .value=${this.value}
            name=${this.name || nothing}
            placeholder=${resolvedPlaceholder}
            aria-labelledby=${labelId}
            aria-describedby=${describedBy ?? nothing}
            aria-invalid=${this.formCtrl.invalid ? 'true' : 'false'}
            aria-errormessage=${resolvedError ? errorId : nothing}
            ?disabled=${isDisabled}
            ?required=${this.required}
            @input=${this.handleTextareaInput}
            @change=${this.handleTextareaChange}
            @blur=${this.handleTextareaBlur}
            @keydown=${this.handleKeyDown}
          ></textarea>

          <div class="footer" part="footer">
            <div class="start-slots">
              <slot name="model"></slot>
            </div>
            <div class="end-slots">
              <slot name="actions"></slot>
              ${this.streaming
                ? html`
                    <mth-button
                      variant="danger"
                      size="sm"
                      part="stop-button"
                      ?disabled=${isDisabled}
                      @click=${this.handleStopClick}
                    >
                      ${this.t('stopLabel')}
                    </mth-button>
                  `
                : html`
                    <mth-button
                      variant="solid"
                      size="sm"
                      part="submit-button"
                      ?disabled=${!canSend}
                      @click=${this.handleSubmitClick}
                    >
                      ${this.t('submitLabel')}
                    </mth-button>
                  `}
            </div>
          </div>
        </div>

        <p id=${hintId} class="hint" part="hint" ?hidden=${!resolvedHint}>
          ${resolvedHint}
        </p>
        <p
          id=${errorId}
          class="error"
          part="error"
          role="alert"
          ?hidden=${!resolvedError}
        >
          ${resolvedError}
        </p>
      </div>
    `;
  }
}
