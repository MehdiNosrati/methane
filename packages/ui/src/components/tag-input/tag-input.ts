import { UIElement, type PropertyValues } from '@methane/core';
import { FormControlController, InputController, SelectionController } from '@methane/primitives';
import { html, nothing } from 'lit';
import { property, query, state } from 'lit/decorators.js';
import { ifDefined } from 'lit/directives/if-defined.js';
import { tagInputMessages } from './tag-input.messages.js';
import { tagInputStyles } from './tag-input.styles.js';

/**
 * `<mth-tag-input>`: form-associated chip/tag input supporting Enter and
 * delimiter creation, paste splitting, Backspace removal, duplicate prevention, and max-tags.
 */
export class MthTagInput extends UIElement {
  static formAssociated = true;
  static override shadowRootOptions = { mode: 'open' as const, delegatesFocus: true };
  static override messages = tagInputMessages;
  static override styles = tagInputStyles;

  @property({ type: String, reflect: true })
  name = '';

  @property({ type: String })
  value = '';

  @property({ type: String, attribute: 'default-value' })
  defaultValue = '';

  @property({ type: Number, attribute: 'max-tags' })
  maxTags = 0;

  @property({ type: Boolean, reflect: true, attribute: 'allow-duplicates' })
  allowDuplicates = false;

  @property({ type: String })
  delimiter = ',';

  @property({ attribute: false })
  delimiters: ReadonlyArray<string> | null = null;

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
  readonly = false;

  @property({ type: Boolean, reflect: true })
  required = false;

  @state()
  private draftText = '';

  @state()
  private tagList: Array<string> = [];

  @state()
  private slottedLabelText = '';

  @state()
  private slottedHintText = '';

  @state()
  private slottedErrorText = '';

  @query('#mth-ti-input')
  private inputEl!: HTMLInputElement | null;

  private readonly formCtrl: FormControlController;
  private readonly inputCtrl: InputController;
  private readonly selectionCtrl: SelectionController<string>;
  private syncingValue = false;

  constructor() {
    super();

    this.formCtrl = new FormControlController(this, {
      internals: this.internals,
      defaultValue: '',
      messages: tagInputMessages,
      onValueSync: (nextVal) => {
        this.applyValueString(nextVal);
      },
      onDisabledChange: () => {
        this.requestUpdate();
      },
      onSetCustomState: (stateName, active) => {
        this.setCustomState(stateName, active);
      },
      validator: () => {
        const err = this.error || this.slottedErrorText || this.formCtrl.fieldContext?.error || '';
        return err.length > 0 ? { flags: { customError: true }, message: err } : null;
      },
    });

    this.inputCtrl = new InputController(this);
    this.selectionCtrl = new SelectionController<string>(this, {
      mode: 'multiple',
      allowEmpty: true,
    });
  }

  get values(): ReadonlyArray<string> {
    return this.tagList;
  }

  set values(next: ReadonlyArray<string>) {
    this.syncTags([...next], false);
  }

  get isEffectivelyDisabled(): boolean {
    return this.disabled || this.formCtrl.disabled;
  }

  protected override onFormDisabled(disabled: boolean): void {
    this.formCtrl.handleFormDisabled(disabled);
    this.requestUpdate();
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

  override willUpdate(changed: PropertyValues<this>): void {
    super.willUpdate(changed);

    if (changed.has('defaultValue')) {
      this.formCtrl.setDefaultValue(this.defaultValue);
    }

    if (changed.has('value') && !this.syncingValue) {
      this.applyValueString(this.value);
    }

    if (changed.has('required') || changed.has('disabled') || changed.has('readonly') || changed.has('error')) {
      this.formCtrl.required = this.required;
      this.formCtrl.hostDisabled = this.disabled;
      this.formCtrl.hostReadOnly = this.readonly;
      this.formCtrl.validate();
    }
  }

  override updated(changed: PropertyValues<this>): void {
    super.updated(changed);
    this.inputCtrl.bind(this.inputEl ?? null);
  }

  override focus(options?: FocusOptions): void {
    this.inputEl?.focus(options);
  }

  checkValidity(): boolean {
    return this.formCtrl.checkValidity();
  }

  reportValidity(): boolean {
    return this.formCtrl.reportValidity();
  }

  addTag(raw: string): boolean {
    if (this.isEffectivelyDisabled || this.readonly) return false;
    const tag = raw.trim();
    if (!tag) return false;
    if (!this.allowDuplicates && this.tagList.includes(tag)) return false;
    if (this.maxTags > 0 && this.tagList.length >= this.maxTags) return false;

    const next = [...this.tagList, tag];
    this.syncTags(next, true);
    this.dispatchEvent(
      new CustomEvent('mth-tag-add', {
        detail: { tag, values: next },
        bubbles: true,
        composed: true,
      }),
    );
    return true;
  }

  removeTagAt(index: number): boolean {
    if (this.isEffectivelyDisabled || this.readonly) return false;
    if (index < 0 || index >= this.tagList.length) return false;
    const removed = this.tagList[index]!;
    const next = this.tagList.filter((_, i) => i !== index);
    this.syncTags(next, true);
    this.dispatchEvent(
      new CustomEvent('mth-tag-remove', {
        detail: { tag: removed, index, values: next },
        bubbles: true,
        composed: true,
      }),
    );
    return true;
  }

  private applyValueString(raw: string): void {
    const parsed = raw
      .split(',')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
    this.syncTags(parsed, false);
  }

  private syncTags(next: Array<string>, fromUser: boolean): void {
    this.syncingValue = true;
    this.tagList = next;
    this.selectionCtrl.setItems(next.map((t) => ({ value: t })));
    this.selectionCtrl.setSelection(next);
    const joined = next.join(',');
    this.value = joined;
    this.formCtrl.setValue(joined, { markDirty: fromUser });
    this.syncingValue = false;

    if (fromUser) {
      this.dispatchEvent(
        new CustomEvent('mth-change', {
          detail: { value: joined, values: [...next] },
          bubbles: true,
          composed: true,
        }),
      );
    }
  }

  private getDelimiterList(): ReadonlyArray<string> {
    if (this.delimiters && this.delimiters.length > 0) return this.delimiters;
    return this.delimiter ? [this.delimiter] : [','];
  }

  private handleInput(event: Event): void {
    if (this.isEffectivelyDisabled || this.readonly || this.inputCtrl.isComposing) return;
    const val = (event.target as HTMLInputElement).value;
    const delims = this.getDelimiterList();
    const matchedDelim = delims.find((d) => val.includes(d));
    if (matchedDelim) {
      const parts = val.split(matchedDelim);
      const trailing = parts.pop() ?? '';
      for (const part of parts) {
        this.addTag(part);
      }
      this.draftText = trailing;
      if (this.inputEl) this.inputEl.value = trailing;
      return;
    }
    this.draftText = val;
  }

  private handleKeyDown(event: KeyboardEvent): void {
    if (this.isEffectivelyDisabled || this.readonly || this.inputCtrl.isComposing || event.isComposing) return;
    if (event.key === 'Enter' || this.getDelimiterList().includes(event.key)) {
      if (this.draftText.trim().length > 0) {
        event.preventDefault();
        if (this.addTag(this.draftText)) {
          this.draftText = '';
          if (this.inputEl) this.inputEl.value = '';
        }
      }
      return;
    }

    if (event.key === 'Backspace' && this.draftText === '' && this.tagList.length > 0) {
      event.preventDefault();
      this.removeTagAt(this.tagList.length - 1);
    }
  }

  private handlePaste(event: ClipboardEvent): void {
    if (this.isEffectivelyDisabled || this.readonly) return;
    const text = event.clipboardData?.getData('text') ?? '';
    if (!text) return;
    const escaped = this.getDelimiterList().map((d) => d.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
    const splitter = new RegExp(`[\\n\\r${escaped.join('')}]`);
    if (splitter.test(text)) {
      event.preventDefault();
      for (const chunk of text.split(splitter)) {
        this.addTag(chunk);
      }
      this.draftText = '';
    }
  }

  private handleLabelSlotChange(event: Event): void {
    const slot = event.target as HTMLSlotElement;
    this.slottedLabelText = slot.assignedNodes({ flatten: true }).map((n) => n.textContent ?? '').join('').trim();
  }

  private handleHintSlotChange(event: Event): void {
    const slot = event.target as HTMLSlotElement;
    this.slottedHintText = slot.assignedNodes({ flatten: true }).map((n) => n.textContent ?? '').join('').trim();
  }

  private handleErrorSlotChange(event: Event): void {
    const slot = event.target as HTMLSlotElement;
    this.slottedErrorText = slot.assignedNodes({ flatten: true }).map((n) => n.textContent ?? '').join('').trim();
  }

  override render() {
    const ctx = this.formCtrl.fieldContext;
    const effLabel = this.label || this.slottedLabelText || ctx?.label || '';
    const effHint = this.hint || this.slottedHintText || ctx?.hint || '';
    const rawError = this.error || this.slottedErrorText || ctx?.error || '';
    const hasLabel = Boolean(effLabel);
    const hasHint = Boolean(effHint);
    const hasError = Boolean(rawError);
    const describedByIds: Array<string> = [];
    if (hasHint) describedByIds.push('mth-ti-hint');
    if (hasError) describedByIds.push('mth-ti-error');
    const effPlaceholder = this.placeholder || this.t('placeholder');

    return html`
      <div part="base" class="base">
        <label id="mth-ti-label" for="mth-ti-input" part="label" class="label" ?hidden=${!hasLabel}>
          <slot name="label" @slotchange=${this.handleLabelSlotChange}>${effLabel}</slot>
        </label>

        <div
          part="control"
          class="control"
          @click=${() => {
            if (!this.isEffectivelyDisabled) this.inputEl?.focus();
          }}
        >
          ${this.tagList.map(
            (tag, index) => html`
              <span part="tag" class="tag">
                <span>${tag}</span>
                ${!this.readonly
                  ? html`
                      <button
                        type="button"
                        part="tag-remove"
                        class="tag-remove"
                        aria-label="${this.t('removeTag')} ${tag}"
                        ?disabled=${this.isEffectivelyDisabled}
                        @click=${(e: Event) => {
                          e.stopPropagation();
                          this.removeTagAt(index);
                        }}
                      >
                        ×
                      </button>
                    `
                  : nothing}
              </span>
            `,
          )}

          <input
            id="mth-ti-input"
            part="input"
            class="input"
            type="text"
            aria-labelledby=${ifDefined(hasLabel ? 'mth-ti-label' : undefined)}
            aria-label=${ifDefined(!hasLabel ? this.t('defaultLabel') : undefined)}
            aria-describedby=${ifDefined(describedByIds.length > 0 ? describedByIds.join(' ') : undefined)}
            .value=${this.draftText}
            placeholder=${this.tagList.length === 0 ? effPlaceholder : ''}
            ?disabled=${this.isEffectivelyDisabled}
            ?readonly=${this.readonly}
            @input=${this.handleInput}
            @keydown=${this.handleKeyDown}
            @paste=${this.handlePaste}
          />
        </div>

        <div id="mth-ti-hint" part="hint" class="hint" ?hidden=${!hasHint}>
          <slot name="hint" @slotchange=${this.handleHintSlotChange}>${effHint}</slot>
        </div>

        <div id="mth-ti-error" part="error" class="error" role="alert" ?hidden=${!hasError}>
          <slot name="error" @slotchange=${this.handleErrorSlotChange}>${rawError}</slot>
        </div>
      </div>
    `;
  }
}
