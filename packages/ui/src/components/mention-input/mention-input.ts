import { UIElement, type PropertyValues } from '@methane-ui/core';
import {
  FormControlController,
  InputController,
  ListboxController,
  OverlayController,
  PositioningController,
} from '@methane-ui/primitives';
import { html, nothing } from 'lit';
import { property, query, state } from 'lit/decorators.js';
import { mentionInputMessages } from './mention-input.messages.js';
import { mentionInputStyles } from './mention-input.styles.js';

export interface MentionOption {
  readonly value: string;
  readonly label: string;
  readonly description?: string;
  readonly disabled?: boolean;
}

export interface MentionChangeDetail {
  readonly value: string;
  readonly mentions: ReadonlyArray<string>;
}

export interface MentionSelectDetail {
  readonly option: MentionOption;
  readonly trigger: string;
  readonly value: string;
}

let mentionInputIdCounter = 0;

/**
 * `<mth-mention-input>`: form-associated text/textarea input supporting
 * trigger-character mention autocomplete with top-layer listbox overlay.
 */
export class MthMentionInput extends UIElement {
  static formAssociated = true;
  static override shadowRootOptions = { mode: 'open' as const, delegatesFocus: true };
  static override messages = mentionInputMessages;
  static override styles = mentionInputStyles;

  @property({ type: String, reflect: true })
  name = '';

  @property({ type: String })
  value = '';

  @property({ type: String, attribute: 'default-value' })
  defaultValue = '';

  @property({ type: String })
  trigger = '@';

  @property({ attribute: false })
  options: ReadonlyArray<MentionOption> | null = null;

  @property({ type: String })
  label = '';

  @property({ type: String })
  placeholder = '';

  @property({ type: String })
  hint = '';

  @property({ type: String })
  error = '';

  @property({ type: Boolean })
  multiline = false;

  @property({ type: Number })
  rows = 3;

  @property({ type: Boolean, reflect: true })
  open = false;

  @property({ type: Boolean, reflect: true })
  disabled = false;

  @property({ type: Boolean, reflect: true })
  readOnly = false;

  @property({ type: Boolean, reflect: true })
  required = false;

  @state()
  private mentionQuery = '';

  @state()
  private triggerStart = -1;

  @state()
  private formDisabled = false;

  @query('.control')
  private controlEl!: HTMLElement;

  @query('.input')
  private inputEl!: HTMLInputElement | HTMLTextAreaElement;

  @query('.popup')
  private popupEl!: HTMLElement;

  @query('.listbox')
  private listboxEl!: HTMLElement;

  private readonly uid = `mth-mention-${++mentionInputIdCounter}`;
  private syncingValue = false;
  private readonly formCtrl: FormControlController;
  private readonly inputCtrl: InputController;
  private readonly overlayCtrl: OverlayController;
  private readonly positionCtrl: PositioningController;
  private readonly listboxCtrl: ListboxController;

  constructor() {
    super();

    this.formCtrl = new FormControlController(this, {
      internals: this.internals,
      defaultValue: this.defaultValue,
      required: this.required,
      disabled: this.disabled,
      readOnly: this.readOnly,
      messages: {
        ...mentionInputMessages,
        required: mentionInputMessages.requiredError,
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

    this.inputCtrl = new InputController(this);

    this.overlayCtrl = new OverlayController(this, {
      mode: 'popover',
      surface: () => this.popupEl,
      closeOnEscape: true,
      lightDismiss: true,
      restoreFocus: true,
      onOpenChange: (nextOpen) => {
        this.open = nextOpen;
        if (nextOpen) {
          void this.updateComplete.then(() => {
            this.positionCtrl.reposition();
          });
        }
      },
    });

    this.positionCtrl = new PositioningController(this, {
      anchor: () => this.controlEl,
      floating: () => this.popupEl,
      placement: 'bottom-start',
      offset: 6,
      flip: true,
      shift: true,
    });

    this.listboxCtrl = new ListboxController(this, {
      focusMode: 'activedescendant',
      multiple: false,
      loop: true,
      getListboxElement: () => this.listboxEl,
      getOptionElements: () =>
        Array.from(this.listboxEl?.querySelectorAll<HTMLElement>('[role="option"]') ?? []),
      onSelectionChange: (selected) => {
        const val = selected[0];
        if (!val) return;
        const match = (this.options ?? []).find((o) => o.value === val);
        if (match) {
          this.applyMention(match);
        }
      },
    });
  }

  get isEffectivelyDisabled(): boolean {
    return this.disabled || this.formDisabled;
  }

  get mentions(): ReadonlyArray<string> {
    return this.extractMentions(this.value);
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

  async show(): Promise<boolean> {
    if (this.isEffectivelyDisabled || this.readOnly) return false;
    const opened = await this.overlayCtrl.show();
    if (opened) {
      await this.updateComplete;
      this.positionCtrl.reposition();
    }
    return opened;
  }

  async hide(): Promise<boolean> {
    return this.overlayCtrl.hide();
  }

  protected override onFormDisabled(disabled: boolean): void {
    this.formCtrl.handleFormDisabled(disabled);
    if (disabled && this.open) {
      void this.hide();
    }
  }

  protected override onFormReset(): void {
    this.formCtrl.handleFormReset();
  }

  protected override onFormStateRestore(state: string | File | FormData | null, mode: 'restore' | 'autocomplete'): void {
    this.formCtrl.handleFormStateRestore(state, mode);
  }

  override connectedCallback(): void {
    super.connectedCallback();
    this.formCtrl.setDefaultValue(this.defaultValue);
    if (this.value) {
      this.formCtrl.setValue(this.value, { markDirty: false });
    }
  }

  protected override firstUpdated(): void {
    this.inputCtrl.bind(this.inputEl ?? null);
    if (this.open && !this.isEffectivelyDisabled) {
      void this.show();
    }
  }

  override updated(changed: PropertyValues): void {
    const lbActive = this.listboxEl?.getAttribute('aria-activedescendant');
    if (lbActive && (!this.open || !this.shadowRoot?.getElementById(lbActive))) {
      this.listboxEl?.removeAttribute('aria-activedescendant');
    }
    super.updated(changed);
    this.inputCtrl.bind(this.inputEl ?? null);
  }

  override willUpdate(changed: PropertyValues): void {
    super.willUpdate(changed);
    if (changed.has('defaultValue')) {
      this.formCtrl.setDefaultValue(this.defaultValue);
    }
    if (changed.has('required')) {
      this.formCtrl.required = this.required;
    }
    if (changed.has('disabled')) {
      this.formCtrl.hostDisabled = this.disabled;
      if (this.disabled && this.open) {
        void this.hide();
      }
    }
    if (changed.has('readOnly')) {
      this.formCtrl.hostReadOnly = this.readOnly;
    }
    if (changed.has('error')) {
      this.formCtrl.setValidity(this.error ? { customError: true } : {}, this.error);
    }
    if (changed.has('value') && !this.syncingValue) {
      this.formCtrl.setValue(this.value, { markDirty: false });
    }
  }

  private getFilteredOptions(): ReadonlyArray<MentionOption> {
    const all = this.options ?? [];
    const q = this.mentionQuery.trim().toLowerCase();
    if (!q) return all;
    return all.filter(
      (o) => o.label.toLowerCase().includes(q) || o.value.toLowerCase().includes(q),
    );
  }

  private extractMentions(text: string): ReadonlyArray<string> {
    if (!text) return [];
    const trig = this.trigger || '@';
    const escaped = trig.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(?:^|\\s)${escaped}([\\w.-]+)`, 'g');
    const found: string[] = [];
    let match = regex.exec(text);
    while (match !== null) {
      const token = match[1];
      if (token && !found.includes(token)) {
        found.push(token);
      }
      match = regex.exec(text);
    }
    return found;
  }

  private detectTriggerQuery(text: string, caret: number): { start: number; query: string } | null {
    const trig = this.trigger || '@';
    const before = text.slice(0, caret);
    const idx = before.lastIndexOf(trig);
    if (idx < 0) return null;
    if (idx > 0 && !/\s/.test(before[idx - 1] ?? '')) return null;
    const afterTrig = before.slice(idx + trig.length);
    if (/\s/.test(afterTrig)) return null;
    return { start: idx, query: afterTrig };
  }

  private emitChange(nextValue: string): void {
    this.dispatchEvent(
      new CustomEvent<MentionChangeDetail>('mth-change', {
        bubbles: true,
        composed: true,
        detail: {
          value: nextValue,
          mentions: this.extractMentions(nextValue),
        },
      }),
    );
  }

  private applyMention(option: MentionOption): void {
    if (option.disabled || this.isEffectivelyDisabled || this.readOnly) return;
    const trig = this.trigger || '@';
    const token = `${trig}${option.value} `;
    const currentText = this.value;
    const caret = this.inputEl?.selectionStart ?? currentText.length;

    let nextText: string;
    let nextCaret: number;

    if (this.triggerStart >= 0 && this.triggerStart <= caret) {
      nextText = currentText.slice(0, this.triggerStart) + token + currentText.slice(caret);
      nextCaret = this.triggerStart + token.length;
    } else {
      nextText = currentText.slice(0, caret) + token + currentText.slice(caret);
      nextCaret = caret + token.length;
    }

    this.syncingValue = true;
    this.value = nextText;
    this.syncingValue = false;
    this.triggerStart = -1;
    this.mentionQuery = '';
    this.formCtrl.setValue(nextText, { markDirty: true });
    this.formCtrl.validate();
    this.listboxCtrl.setSelectedValues([option.value]);

    this.dispatchEvent(
      new CustomEvent<MentionSelectDetail>('mth-mention-select', {
        bubbles: true,
        composed: true,
        detail: { option, trigger: trig, value: nextText },
      }),
    );
    this.emitChange(nextText);
    void this.hide();

    void this.updateComplete.then(() => {
      if (this.inputEl) {
        this.inputEl.focus();
        if (typeof this.inputEl.setSelectionRange === 'function') {
          this.inputEl.setSelectionRange(nextCaret, nextCaret);
        }
      }
    });
  }

  private handleInput = (e: Event): void => {
    if (this.inputCtrl.isComposing) return;
    const target = e.currentTarget as HTMLInputElement | HTMLTextAreaElement;
    const nextValue = target.value;
    this.syncingValue = true;
    this.value = nextValue;
    this.syncingValue = false;
    this.formCtrl.setValue(nextValue, { markDirty: true });
    this.formCtrl.validate();
    this.emitChange(nextValue);

    const caret = target.selectionStart ?? nextValue.length;
    const match = this.detectTriggerQuery(nextValue, caret);
    if (match) {
      this.triggerStart = match.start;
      this.mentionQuery = match.query;
      if (!this.open) {
        void this.show();
      }
    } else {
      this.triggerStart = -1;
      this.mentionQuery = '';
      if (this.open) {
        void this.hide();
      }
    }
  };

  private handleInputKeyDown = (e: KeyboardEvent): void => {
    if (!this.open || this.inputCtrl.isComposing || e.isComposing) return;
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === 'Home' || e.key === 'End' || e.key === 'Enter') {
      if (e.key === 'Enter' && this.getFilteredOptions().length === 0) return;
      e.preventDefault();
      this.listboxEl?.dispatchEvent(
        new KeyboardEvent('keydown', { key: e.key, bubbles: false, cancelable: true }),
      );
    } else if (e.key === 'Escape') {
      e.preventDefault();
      void this.hide();
    }
  };

  private handleBlur = (): void => {
    this.formCtrl.markTouched();
  };

  protected override render() {
    const labelId = `${this.uid}-label`;
    const inputId = `${this.uid}-input`;
    const listboxId = `${this.uid}-listbox`;
    const hintId = `${this.uid}-hint`;
    const errorId = `${this.uid}-error`;
    const ctx = this.formCtrl.fieldContext;
    const effLabel = this.label || ctx?.label || '';
    const effHint = this.hint || ctx?.hint || '';
    const rawError = this.error || ctx?.error || '';
    const effectiveError = rawError || (this.invalid ? this.validationMessage : '');
    const describedBy = [effHint ? hintId : '', effectiveError ? errorId : ''].filter(Boolean).join(' ') || undefined;
    const filtered = this.getFilteredOptions();
    const effPlaceholder = this.placeholder || this.t('placeholder');
    const renderedIds = filtered.map((_, idx) => `${this.uid}-opt-${idx}`);
    const candidateActiveId = this.listboxCtrl.activeOption?.id;
    const activeId = this.open && candidateActiveId && renderedIds.includes(candidateActiveId) ? candidateActiveId : undefined;

    return html`
      <div class="base" part="base">
        ${effLabel
          ? html`<label class="label" part="label" id=${labelId} for=${inputId}>
              <slot name="label">${effLabel}</slot>
            </label>`
          : html`<slot name="label"></slot>`}

        <div class="control" part="control">
          ${this.multiline
            ? html`
                <textarea
                  id=${inputId}
                  class="input"
                  part="input"
                  role="combobox"
                  rows=${this.rows}
                  placeholder=${effPlaceholder}
                  .value=${this.value}
                  ?disabled=${this.isEffectivelyDisabled}
                  ?readonly=${this.readOnly}
                  aria-autocomplete="list"
                  aria-expanded=${this.open ? 'true' : 'false'}
                  aria-controls=${listboxId}
                  aria-activedescendant=${activeId || nothing}
                  aria-labelledby=${effLabel ? labelId : nothing}
                  aria-label=${!effLabel ? this.placeholder || this.t('suggestionsLabel') : nothing}
                  aria-describedby=${describedBy ?? nothing}
                  @input=${this.handleInput}
                  @keydown=${this.handleInputKeyDown}
                  @blur=${this.handleBlur}
                ></textarea>
              `
            : html`
                <input
                  id=${inputId}
                  type="text"
                  class="input"
                  part="input"
                  role="combobox"
                  placeholder=${effPlaceholder}
                  .value=${this.value}
                  ?disabled=${this.isEffectivelyDisabled}
                  ?readonly=${this.readOnly}
                  aria-autocomplete="list"
                  aria-expanded=${this.open ? 'true' : 'false'}
                  aria-controls=${listboxId}
                  aria-activedescendant=${activeId || nothing}
                  aria-labelledby=${effLabel ? labelId : nothing}
                  aria-label=${!effLabel ? this.placeholder || this.t('suggestionsLabel') : nothing}
                  aria-describedby=${describedBy ?? nothing}
                  @input=${this.handleInput}
                  @keydown=${this.handleInputKeyDown}
                  @blur=${this.handleBlur}
                />
              `}
        </div>

        <div class="popup" part="popup" ?hidden=${!this.open}>
          <ul
            id=${listboxId}
            class="listbox"
            part="listbox"
            role="listbox"
            tabindex="-1"
            aria-label=${effLabel || this.t('suggestionsLabel')}
          >
            ${filtered.length === 0
              ? html`<li class="empty">${this.t('noResults')}</li>`
              : filtered.map((opt, idx) => {
                  const isActive = this.listboxCtrl.activeOption?.value === opt.value;
                  const isSelected = this.listboxCtrl.selectedValues.includes(opt.value);
                  return html`
                    <li
                      id=${`${this.uid}-opt-${idx}`}
                      class="option"
                      part="option"
                      role="option"
                      data-value=${opt.value}
                      data-active=${isActive ? 'true' : 'false'}
                      aria-selected=${isSelected ? 'true' : 'false'}
                      aria-disabled=${opt.disabled ? 'true' : 'false'}
                      @mousedown=${(e: MouseEvent) => e.preventDefault()}
                      @click=${() => this.applyMention(opt)}
                    >
                      <span>${opt.label}</span>
                      <span class="option-handle">${`${this.trigger || '@'}${opt.value}`}</span>
                    </li>
                  `;
                })}
          </ul>
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
