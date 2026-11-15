import { UIElement, type PropertyValues, html, property, query, state } from '@methane-ui/core';
import { FormControlController, InputController } from '@methane-ui/primitives';
import { inlineEditMessages } from './inline-edit.messages.js';
import { inlineEditStyles } from './inline-edit.styles.js';

/**
 * Form-associated inline click-to-edit control with Enter commit and Escape cancel.
 */
export class MthInlineEdit extends UIElement {
  static formAssociated = true;

  static override shadowRootOptions: ShadowRootInit = {
    mode: 'open',
    delegatesFocus: true,
  };

  static override styles = inlineEditStyles;
  static override messages = inlineEditMessages;

  @property({ type: String })
  value = '';

  @property({ type: String, reflect: true })
  name = '';

  @property({ type: String })
  label = '';

  @property({ type: String })
  placeholder = '';

  @property({ type: Boolean, reflect: true })
  editing = false;

  @property({ type: Boolean, reflect: true })
  disabled = false;

  @property({ type: Boolean, reflect: true })
  readonly = false;

  @property({ type: Boolean, reflect: true })
  required = false;

  @property({ type: Boolean, attribute: 'submit-on-blur' })
  submitOnBlur = true;

  @state()
  private draftValue = '';

  @query('[part="trigger"]')
  private triggerEl!: HTMLButtonElement | null;

  @query('[part="input"]')
  private inputEl!: HTMLInputElement | null;

  private readonly formCtrl: FormControlController;
  private readonly inputCtrl: InputController;

  constructor() {
    super();
    this.formCtrl = new FormControlController(this, {
      internals: this.internals,
      defaultValue: '',
      messages: inlineEditMessages,
      onValueSync: (nextValue) => {
        this.value = nextValue;
        this.draftValue = nextValue;
        this.editing = false;
      },
      onDisabledChange: () => {
        this.requestUpdate();
      },
      onSetCustomState: (stateName, active) => {
        this.setCustomState(stateName, active);
      },
    });

    this.inputCtrl = new InputController(this, {
      onCommitValue: (nextDraft) => {
        this.draftValue = nextDraft;
        this.emitEvent('mth-input', { detail: { value: nextDraft } });
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

  get effectivelyDisabled(): boolean {
    return this.formCtrl.disabled;
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
    this.draftValue = this.value;
  }

  protected override willUpdate(changed: PropertyValues): void {
    super.willUpdate(changed);
    if (changed.has('disabled')) {
      this.formCtrl.hostDisabled = this.disabled;
    }
    if (changed.has('required')) {
      this.formCtrl.required = this.required;
    }
    if (changed.has('readonly')) {
      this.formCtrl.hostReadOnly = this.readonly;
    }
    if (changed.has('value')) {
      this.formCtrl.setValue(this.value, { markDirty: false });
      if (!this.editing) {
        this.draftValue = this.value;
      }
    }
  }

  protected override updated(changed: PropertyValues): void {
    super.updated(changed);
    if (changed.has('readonly')) {
      this.setCustomState('readonly', this.readonly);
    }
    if (changed.has('editing')) {
      this.setCustomState('editing', this.editing);
      if (this.editing) {
        this.inputCtrl.bind(this.inputEl);
        this.inputEl?.focus();
      } else {
        this.inputCtrl.bind(null);
      }
    }
  }

  /**
   * Enters edit mode when enabled and not readonly.
   */
  async startEditing(): Promise<void> {
    if (this.effectivelyDisabled || this.readonly || this.editing) return;
    const allowed = this.emitEvent('mth-edit-start', {
      cancelable: true,
      detail: { value: this.value },
    });
    if (!allowed) return;
    this.draftValue = this.value;
    this.editing = true;
    await this.updateComplete;
    this.inputEl?.focus();
    this.inputEl?.select?.();
  }

  /**
   * Commits the current draft value and exits edit mode.
   */
  async commit(): Promise<void> {
    if (!this.editing) return;
    const next = this.inputEl ? this.inputEl.value : this.draftValue;
    const changed = next !== this.value;
    this.value = next;
    this.draftValue = next;
    this.editing = false;
    this.formCtrl.setValue(next, { markDirty: true });
    this.formCtrl.markTouched();
    if (changed) {
      this.emitEvent('mth-change', { detail: { value: next } });
    }
    await this.updateComplete;
    this.triggerEl?.focus();
  }

  /**
   * Discards draft edits, restores original value, and exits edit mode.
   */
  async cancel(): Promise<void> {
    if (!this.editing) return;
    this.draftValue = this.value;
    this.editing = false;
    this.emitEvent('mth-cancel', { detail: { value: this.value } });
    await this.updateComplete;
    this.triggerEl?.focus();
  }

  private readonly handleTriggerClick = (): void => {
    void this.startEditing();
  };

  private readonly handleInputKeyDown = (event: KeyboardEvent): void => {
    if (event.key === 'Enter' && !this.inputCtrl.isComposing) {
      event.preventDefault();
      void this.commit();
    } else if (event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      void this.cancel();
    }
  };

  private readonly handleInputBlur = (): void => {
    this.formCtrl.markTouched();
    if (this.submitOnBlur && this.editing) {
      void this.commit();
    }
  };

  override render() {
    const isDisabled = this.effectivelyDisabled;
    const displayText = this.value || this.placeholder || this.t('emptyPlaceholder');
    const isEmpty = !this.value;
    const accessibleLabel = this.label.trim() || this.t('editPrompt');

    return html`
      <div part="base">
        ${this.editing
          ? html`
              <input
                part="input"
                type="text"
                .value=${this.draftValue}
                placeholder=${this.placeholder}
                aria-label=${accessibleLabel}
                ?disabled=${isDisabled}
                ?readonly=${this.readonly}
                ?required=${this.required}
                @keydown=${this.handleInputKeyDown}
                @blur=${this.handleInputBlur}
              />
            `
          : html`
              <button
                part="trigger"
                type="button"
                data-empty=${isEmpty ? 'true' : 'false'}
                aria-label=${`${accessibleLabel}: ${displayText}`}
                ?disabled=${isDisabled}
                @click=${this.handleTriggerClick}
              >
                <span part="value">${displayText}</span>
              </button>
            `}
      </div>
    `;
  }
}
