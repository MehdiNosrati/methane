import { UIElement, type PropertyValues } from '@methane/core';
import { FormControlController, InputController } from '@methane/primitives';
import { html, nothing, svg } from 'lit';
import { property, query, state } from 'lit/decorators.js';
import { ifDefined } from 'lit/directives/if-defined.js';
import { searchInputMessages } from './search-input.messages.js';
import { searchInputStyles } from './search-input.styles.js';

/**
 * `<mth-search-input>`: form-associated search input with debounced `mth-search`,
 * accessible clear button, Escape-to-clear, and optional shortcut hint badge.
 */
export class MthSearchInput extends UIElement {
  static formAssociated = true;
  static override shadowRootOptions = { mode: 'open' as const, delegatesFocus: true };
  static override messages = searchInputMessages;
  static override styles = searchInputStyles;

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
  shortcut = '';

  @property({ type: Number })
  debounce = 300;

  @property({ type: Boolean, reflect: true })
  clearable = true;

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

  @query('#mth-search-control')
  private controlEl!: HTMLInputElement | null;

  private readonly formCtrl: FormControlController;
  private readonly inputCtrl: InputController;
  private searchTimer: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    super();
    this.formCtrl = new FormControlController(this, {
      internals: this.internals,
      defaultValue: '',
      messages: searchInputMessages,
      onValueSync: (nextValue, source) => {
        const changed = this.value !== nextValue;
        this.value = nextValue;
        if (this.controlEl && this.controlEl.value !== nextValue) {
          this.controlEl.value = nextValue;
        }
        if (source === 'autofill' && changed) {
          this.emitEvent('mth-input', { detail: { value: nextValue } });
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

  clear(): void {
    if (this.formCtrl.disabled || this.formCtrl.readOnly) return;
    this.clearPendingSearch();
    this.value = '';
    if (this.controlEl) {
      this.controlEl.value = '';
    }
    this.formCtrl.setValue('', { markDirty: true });
    this.emitEvent('mth-input', { detail: { value: '' } });
    this.emitEvent('mth-clear', { detail: {} });
    this.emitEvent('mth-search', { detail: { value: '' } });
    this.controlEl?.focus();
  }

  protected override onFirstConnect(): void {
    const initialDefault = this.getAttribute('value') ?? this.value ?? '';
    this.formCtrl.setDefaultValue(initialDefault);
    this.formCtrl.setValue(this.value, { markDirty: false });
  }

  override disconnectedCallback(): void {
    this.clearPendingSearch();
    super.disconnectedCallback();
  }

  protected override onFormDisabled(disabled: boolean): void {
    this.formCtrl.handleFormDisabled(disabled);
  }

  protected override onFormReset(): void {
    this.clearPendingSearch();
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
    if (changedProperties.has('error')) {
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

  private clearPendingSearch(): void {
    if (this.searchTimer !== null) {
      clearTimeout(this.searchTimer);
      this.searchTimer = null;
    }
  }

  private scheduleSearch(nextValue: string): void {
    this.clearPendingSearch();
    const delay = Number.isFinite(this.debounce) && this.debounce > 0 ? this.debounce : 0;
    if (delay === 0) {
      this.emitEvent('mth-search', { detail: { value: nextValue } });
      return;
    }
    this.searchTimer = setTimeout(() => {
      this.searchTimer = null;
      this.emitEvent('mth-search', { detail: { value: nextValue } });
    }, delay);
  }

  private applyUserInputValue(nextValue: string): void {
    this.value = nextValue;
    this.formCtrl.setValue(nextValue, { markDirty: true });
    this.emitEvent('mth-input', { detail: { value: nextValue } });
    this.scheduleSearch(nextValue);
  }

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
    if (this.inputCtrl.isComposing) return;
    if (event.key === 'Enter' && !event.defaultPrevented) {
      this.clearPendingSearch();
      this.emitEvent('mth-search', { detail: { value: this.value } });
      return;
    }
    if (
      event.key === 'Escape' &&
      this.clearable &&
      this.value.length > 0 &&
      !this.formCtrl.disabled &&
      !this.formCtrl.readOnly
    ) {
      event.preventDefault();
      this.clear();
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
    const showClear = this.clearable && this.value.length > 0 && !isDisabled && !isReadonly;
    const showShortcut = this.shortcut.length > 0 && this.value.length === 0;

    return html`
      <div part="base" class="base">
        <label
          id="mth-search-label"
          for="mth-search-control"
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
          <span part="icon" class="icon" aria-hidden="true">
            <slot name="prefix">
              ${svg`<svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>`}
            </slot>
          </span>
          <input
            id="mth-search-control"
            part="control"
            class="control"
            type="search"
            .value=${this.value}
            name=${ifDefined(this.name || undefined)}
            placeholder=${ifDefined(this.placeholder || undefined)}
            autocomplete=${ifDefined(this.autocomplete || undefined)}
            aria-label=${!hasLabel ? this.t('defaultLabel') : nothing}
            ?disabled=${isDisabled}
            ?required=${isRequired}
            ?readonly=${isReadonly}
            aria-invalid=${isInvalid ? 'true' : 'false'}
            aria-describedby=${hasHint && !hasError ? 'mth-search-hint' : nothing}
            aria-errormessage=${isInvalid && hasError ? 'mth-search-error' : nothing}
            @change=${this.handleNativeChange}
            @blur=${this.handleNativeBlur}
            @keydown=${this.handleNativeKeydown}
          />
          ${showClear
            ? html`
                <button
                  type="button"
                  part="clear"
                  class="clear"
                  aria-label=${this.t('clearSearch')}
                  @click=${() => this.clear()}
                >
                  ${svg`<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M18 6 6 18M6 6l12 12" /></svg>`}
                </button>
              `
            : nothing}
          ${showShortcut ? html`<kbd part="shortcut" class="shortcut">${this.shortcut}</kbd>` : nothing}
          <slot name="suffix"></slot>
        </div>
        <p
          id="mth-search-hint"
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
          id="mth-search-error"
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
