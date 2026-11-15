import { UIElement, type PropertyValues } from '@methane/core';
import { FormControlController, InputController } from '@methane/primitives';
import { html, nothing } from 'lit';
import { property, query, state } from 'lit/decorators.js';
import { messageComposerMessages } from './message-composer.messages.js';
import { messageComposerStyles } from './message-composer.styles.js';

let composerCounter = 0;

/**
 * `<mth-message-composer>`: form-associated IME-safe message composer with `InputController`,
 * `FormControlController`, `Enter` / `Mod+Enter` submit, and attachment/emoji/stop controls.
 */
export class MthMessageComposer extends UIElement {
  static formAssociated = true;
  static override shadowRootOptions = { mode: 'open' as const, delegatesFocus: true };
  static override messages = messageComposerMessages;
  static override styles = messageComposerStyles;

  @property({ type: String })
  value = '';

  @property({ type: String, attribute: 'default-value' })
  defaultValue = '';

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

  @property({ type: Number, attribute: 'max-length' })
  maxLength = 0;

  @state()
  private formDisabled = false;

  @query('.textarea')
  private textareaEl!: HTMLTextAreaElement;

  private readonly uid = `mth-msg-comp-${++composerCounter}`;
  private syncingValue = false;
  private boundTextarea: HTMLTextAreaElement | null = null;
  private readonly formCtrl: FormControlController;
  private readonly inputCtrl: InputController;

  constructor() {
    super();

    this.formCtrl = new FormControlController(this, {
      internals: this.internals,
      defaultValue: this.defaultValue,
      required: this.required,
      disabled: this.disabled,
      messages: {
        ...messageComposerMessages,
        required: messageComposerMessages.requiredError,
      },
      validator: () => {
        const err = this.error || this.formCtrl.fieldContext?.error || '';
        return err.length > 0 ? { flags: { customError: true }, message: err } : null;
      },
      onValueSync: (val) => {
        const next = val ?? '';
        if (this.value !== next) {
          this.syncingValue = true;
          this.value = next;
          this.syncingValue = false;
        }
      },
      onDisabledChange: (isDisabled) => {
        this.formDisabled = isDisabled;
      },
    });

    this.inputCtrl = new InputController(this, {
      onCommitValue: (nextVal) => {
        if (this.inputCtrl.isComposing || this.syncingValue) return;
        this.applyInputValue(nextVal);
      },
    });
  }

  get isEffectivelyDisabled(): boolean {
    return this.disabled || this.formDisabled;
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

  get validationMessage(): string {
    return this.formCtrl.validationMessage;
  }

  checkValidity(): boolean {
    return this.formCtrl.checkValidity();
  }

  reportValidity(): boolean {
    return this.formCtrl.reportValidity();
  }

  override focus(options?: FocusOptions): void {
    this.textareaEl?.focus(options);
  }

  submitMessage(): boolean {
    if (this.isEffectivelyDisabled) return false;
    const trimmed = this.value.trim();
    if (!trimmed) {
      this.formCtrl.markTouched();
      this.formCtrl.markDirty();
      this.formCtrl.validate();
      return false;
    }
    const allowed = this.emitEvent<{ value: string }>('mth-submit', {
      cancelable: true,
      detail: { value: trimmed },
    });
    return allowed;
  }

  protected override onFormDisabled(disabled: boolean): void {
    this.formCtrl.handleFormDisabled(disabled);
  }

  protected override onFormReset(): void {
    this.formCtrl.handleFormReset();
  }

  protected override onFormStateRestore(
    state: File | string | FormData | null,
    mode: 'restore' | 'autocomplete',
  ): void {
    this.formCtrl.handleFormStateRestore(state, mode);
  }

  override connectedCallback(): void {
    super.connectedCallback();
    this.formCtrl.setDefaultValue(this.defaultValue || this.value);
    if (this.value) {
      this.formCtrl.setValue(this.value, { markDirty: false });
    }
    this.syncStates();
  }

  override disconnectedCallback(): void {
    this.boundTextarea = null;
    super.disconnectedCallback();
  }

  override willUpdate(changed: PropertyValues<this>): void {
    super.willUpdate(changed);
    if (changed.has('defaultValue')) {
      this.formCtrl.setDefaultValue(this.defaultValue);
    }
    if (changed.has('required')) {
      this.formCtrl.required = this.required;
    }
    if (changed.has('disabled')) {
      this.formCtrl.hostDisabled = this.disabled;
    }
    if (changed.has('error')) {
      this.formCtrl.validate();
    }
    if (changed.has('value') && !this.syncingValue) {
      this.formCtrl.setValue(this.value, { markDirty: false });
    }
    if (changed.has('disabled') || changed.has('streaming') || changed.has('error')) {
      this.syncStates();
    }
  }

  protected override updated(changed: PropertyValues<this>): void {
    super.updated(changed);
    if (this.textareaEl && this.boundTextarea !== this.textareaEl) {
      this.boundTextarea = this.textareaEl;
      this.inputCtrl.bind(this.textareaEl);
    }
    this.syncStates();
  }

  private syncStates(): void {
    this.setCustomState('disabled', this.isEffectivelyDisabled);
    this.setCustomState('streaming', this.streaming);
    this.setCustomState('invalid', this.invalid);
  }

  private applyInputValue(nextVal: string): void {
    this.syncingValue = true;
    this.value = nextVal;
    this.formCtrl.setValue(nextVal, { markDirty: true });
    this.syncingValue = false;
    this.emitEvent('mth-input', { detail: { value: nextVal } });
  }

  private handleInput = (e: Event): void => {
    if (this.inputCtrl.isComposing) return;
    const target = e.currentTarget as HTMLTextAreaElement;
    this.applyInputValue(target.value);
  };

  private handleChange = (): void => {
    this.formCtrl.markTouched();
    this.emitEvent('mth-change', { detail: { value: this.value } });
  };

  private handleKeyDown = (e: KeyboardEvent): void => {
    if (this.isEffectivelyDisabled || this.inputCtrl.isComposing || e.isComposing) return;
    if (e.key !== 'Enter') return;
    const isModSubmit = e.metaKey || e.ctrlKey;
    const isPlainSubmit =
      this.submitOnEnter && !e.shiftKey && !e.ctrlKey && !e.metaKey && !e.altKey;
    if (isModSubmit || isPlainSubmit) {
      e.preventDefault();
      this.submitMessage();
    }
  };

  protected override render() {
    const labelId = `${this.uid}-label`;
    const textareaId = `${this.uid}-textarea`;
    const hintId = `${this.uid}-hint`;
    const errorId = `${this.uid}-error`;
    const ctx = this.formCtrl.fieldContext;
    const effLabel = this.label || ctx?.label || '';
    const effHint = this.hint || ctx?.hint || '';
    const rawError = this.error || ctx?.error || '';
    const effectiveError = rawError || (this.invalid ? this.validationMessage : '');
    const effPlaceholder = this.placeholder || this.t('placeholder');
    const describedBy =
      [effHint ? hintId : '', effectiveError ? errorId : ''].filter(Boolean).join(' ') || undefined;

    return html`
      <div class="base" part="base">
        ${effLabel
          ? html`<label class="label" part="label" id=${labelId} for=${textareaId}>
              <slot name="label">${effLabel}</slot>
            </label>`
          : html`<slot name="label"></slot>`}

        <div class="shell">
          <textarea
            id=${textareaId}
            class="textarea"
            part="textarea"
            .value=${this.value}
            placeholder=${effPlaceholder}
            ?disabled=${this.isEffectivelyDisabled}
            ?required=${this.required || Boolean(ctx?.required)}
            maxlength=${this.maxLength > 0 ? String(this.maxLength) : nothing}
            aria-labelledby=${effLabel ? labelId : nothing}
            aria-label=${!effLabel ? this.t('label') : nothing}
            aria-describedby=${describedBy ?? nothing}
            aria-invalid=${effectiveError ? 'true' : 'false'}
            aria-errormessage=${effectiveError ? errorId : nothing}
            @input=${this.handleInput}
            @change=${this.handleChange}
            @keydown=${this.handleKeyDown}
          ></textarea>

          <div class="toolbar" part="toolbar">
            <div class="actions-group">
              <slot name="actions-start"></slot>
              <button
                type="button"
                class="action-btn"
                part="attach-button"
                aria-label=${this.t('attachLabel')}
                ?disabled=${this.isEffectivelyDisabled}
                @click=${() => this.emitEvent('mth-attach')}
              >
                +
              </button>
              <button
                type="button"
                class="action-btn"
                part="emoji-button"
                aria-label=${this.t('emojiLabel')}
                ?disabled=${this.isEffectivelyDisabled}
                @click=${() => this.emitEvent('mth-emoji')}
              >
                ☺
              </button>
            </div>

            <div class="actions-group">
              <slot name="actions-end"></slot>
              ${this.streaming
                ? html`
                    <button
                      type="button"
                      class="action-btn stop-btn"
                      part="stop-button"
                      aria-label=${this.t('stopLabel')}
                      ?disabled=${this.isEffectivelyDisabled}
                      @click=${() => this.emitEvent('mth-stop')}
                    >
                      ${this.t('stopLabel')}
                    </button>
                  `
                : html`
                    <button
                      type="button"
                      class="action-btn send-btn"
                      part="send-button"
                      aria-label=${this.t('sendLabel')}
                      ?disabled=${this.isEffectivelyDisabled || this.value.trim().length === 0}
                      @click=${() => this.submitMessage()}
                    >
                      ${this.t('sendLabel')}
                    </button>
                  `}
            </div>
          </div>
        </div>

        ${effHint
          ? html`<div class="hint" part="hint" id=${hintId}>
              <slot name="hint">${effHint}</slot>
            </div>`
          : html`<slot name="hint"></slot>`}
        ${effectiveError
          ? html`<div class="error" part="error" id=${errorId} role="alert">
              <slot name="error">${effectiveError}</slot>
            </div>`
          : html`<slot name="error"></slot>`}
      </div>
    `;
  }
}
