import { UIElement, type PropertyValues } from '@methane/core';
import {
  FormControlController,
  ListboxController,
  OverlayController,
  PositioningController,
  SelectionController,
} from '@methane/primitives';
import { html, nothing } from 'lit';
import { property, query, state } from 'lit/decorators.js';
import { ifDefined } from 'lit/directives/if-defined.js';
import { creatableSelectMessages } from './creatable-select.messages.js';
import { creatableSelectStyles } from './creatable-select.styles.js';

export interface CreatableSelectOption {
  readonly value: string;
  readonly label: string;
  readonly disabled?: boolean;
}

/**
 * `<mth-creatable-select>`: form-associated searchable select/combobox
 * allowing users to select existing options or create new ones on the fly (`mth-create`).
 */
export class MthCreatableSelect extends UIElement {
  static formAssociated = true;
  static override shadowRootOptions = { mode: 'open' as const, delegatesFocus: true };
  static override messages = creatableSelectMessages;
  static override styles = creatableSelectStyles;

  @property({ type: String, reflect: true })
  name = '';

  @property({ type: String })
  value = '';

  @property({ type: String, attribute: 'default-value' })
  defaultValue = '';

  @property({ attribute: false })
  options: ReadonlyArray<CreatableSelectOption> | null = null;

  @property({ type: Boolean, reflect: true })
  multiple = false;

  @property({ type: Boolean, reflect: true, attribute: 'allow-create' })
  allowCreate = true;

  @property({ type: String })
  label = '';

  @property({ type: String })
  placeholder: string = creatableSelectMessages.placeholder;

  @property({ type: String })
  hint = '';

  @property({ type: String })
  error = '';

  @property({ type: Boolean, reflect: true })
  open = false;

  @property({ type: Boolean, reflect: true })
  disabled = false;

  @property({ type: Boolean, reflect: true })
  required = false;

  @state()
  private queryText = '';

  @state()
  private selectedList: Array<string> = [];

  @state()
  private slottedLabelText = '';

  @state()
  private slottedHintText = '';

  @state()
  private slottedErrorText = '';

  @query('#mth-cs-control')
  private controlEl!: HTMLElement | null;

  @query('#mth-cs-input')
  private inputEl!: HTMLInputElement | null;

  @query('#mth-cs-listbox')
  private listboxEl!: HTMLElement | null;

  private readonly formCtrl: FormControlController;
  private readonly selectionCtrl: SelectionController<string>;
  private readonly listboxCtrl: ListboxController;
  private readonly overlayCtrl: OverlayController;
  private readonly positionCtrl: PositioningController;
  private syncingValue = false;

  constructor() {
    super();

    this.formCtrl = new FormControlController(this, {
      internals: this.internals,
      defaultValue: '',
      messages: creatableSelectMessages,
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
        const err = this.error || this.slottedErrorText || '';
        return err.length > 0 ? { flags: { customError: true }, message: err } : null;
      },
    });

    this.selectionCtrl = new SelectionController<string>(this, {
      mode: 'single',
      allowEmpty: true,
      onChange: (selected) => {
        if (this.syncingValue) return;
        this.syncSelectedList([...selected], true);
      },
    });

    this.listboxCtrl = new ListboxController(this, {
      focusMode: 'activedescendant',
      multiple: false,
      loop: true,
      getListboxElement: () => this.listboxEl,
      getOptionElements: () =>
        Array.from(this.shadowRoot?.querySelectorAll<HTMLElement>('[role="option"]') ?? []),
      onSelectionChange: (selected) => {
        this.syncSelectedList([...selected], true);
      },
    });

    this.overlayCtrl = new OverlayController(this, {
      mode: 'popover',
      surface: () => this.listboxEl,
      closeOnEscape: true,
      lightDismiss: true,
      restoreFocus: true,
      onOpenChange: (isOpen) => {
        this.open = isOpen;
        if (isOpen) this.positionCtrl.reposition();
      },
    });

    this.positionCtrl = new PositioningController(this, {
      anchor: () => this.controlEl,
      floating: () => this.listboxEl,
      placement: 'bottom-start',
      offset: 4,
    });
  }

  get values(): ReadonlyArray<string> {
    return this.selectedList;
  }

  set values(next: ReadonlyArray<string>) {
    this.syncSelectedList([...next], false);
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

    if (changed.has('multiple')) {
      this.selectionCtrl.mode = this.multiple ? 'multiple' : 'single';
    }

    if (changed.has('options')) {
      this.selectionCtrl.setItems(
        (this.options ?? []).map((o) => ({ value: o.value, disabled: Boolean(o.disabled) })),
      );
    }

    if (changed.has('value') && !this.syncingValue) {
      this.applyValueString(this.value);
    }

    if (changed.has('required') || changed.has('disabled') || changed.has('error')) {
      this.formCtrl.required = this.required;
      this.formCtrl.hostDisabled = this.disabled;
      this.formCtrl.validate();
    }
  }

  override focus(options?: FocusOptions): void {
    this.inputEl?.focus(options);
  }

  async show(): Promise<boolean> {
    if (this.isEffectivelyDisabled) return false;
    return this.overlayCtrl.show();
  }

  async hide(): Promise<boolean> {
    return this.overlayCtrl.hide();
  }

  checkValidity(): boolean {
    return this.formCtrl.checkValidity();
  }

  reportValidity(): boolean {
    return this.formCtrl.reportValidity();
  }

  clear(): void {
    if (this.isEffectivelyDisabled) return;
    this.queryText = '';
    this.syncSelectedList([], true);
  }

  private applyValueString(raw: string): void {
    const parsed = this.multiple
      ? raw
          .split(',')
          .map((s) => s.trim())
          .filter((s) => s.length > 0)
      : raw
        ? [raw]
        : [];
    this.syncSelectedList(parsed, false);
    if (!this.multiple) {
      this.queryText = raw ? this.resolveLabel(raw) : '';
    }
  }

  private syncSelectedList(next: Array<string>, fromUser: boolean): void {
    this.syncingValue = true;
    this.selectedList = next;
    const joined = this.multiple ? next.join(',') : (next[0] ?? '');
    this.value = joined;
    this.selectionCtrl.setSelection(next);
    this.listboxCtrl.setSelectedValues(next);
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

  private resolveLabel(val: string): string {
    return (this.options ?? []).find((o) => o.value === val)?.label ?? val;
  }

  private selectOption(option: CreatableSelectOption): void {
    if (this.isEffectivelyDisabled || option.disabled) return;
    if (this.multiple) {
      const exists = this.selectedList.includes(option.value);
      const next = exists
        ? this.selectedList.filter((v) => v !== option.value)
        : [...this.selectedList, option.value];
      this.syncSelectedList(next, true);
      this.queryText = '';
    } else {
      this.syncSelectedList([option.value], true);
      this.queryText = option.label;
      void this.hide();
    }
  }

  private createOptionFromQuery(rawQuery: string): void {
    const trimmed = rawQuery.trim();
    if (!trimmed || !this.allowCreate || this.isEffectivelyDisabled) return;
    const current = this.options ?? [];
    const existing = current.find(
      (o) => o.label.toLowerCase() === trimmed.toLowerCase() || o.value.toLowerCase() === trimmed.toLowerCase(),
    );
    if (existing) {
      this.selectOption(existing);
      return;
    }

    const created: CreatableSelectOption = { value: trimmed, label: trimmed };
    this.options = [...current, created];
    this.dispatchEvent(
      new CustomEvent('mth-create', {
        detail: { value: created.value, label: created.label },
        bubbles: true,
        composed: true,
      }),
    );

    if (this.multiple) {
      this.syncSelectedList([...this.selectedList, created.value], true);
      this.queryText = '';
    } else {
      this.syncSelectedList([created.value], true);
      this.queryText = created.label;
      void this.hide();
    }
  }

  private getFilteredOptions(): Array<CreatableSelectOption> {
    const current = this.options ?? [];
    const q = this.queryText.trim().toLowerCase();
    if (!q) return [...current];
    return current.filter(
      (o) => o.label.toLowerCase().includes(q) || o.value.toLowerCase().includes(q),
    );
  }

  private canCreateQuery(): boolean {
    if (!this.allowCreate) return false;
    const q = this.queryText.trim();
    if (!q) return false;
    return !(this.options ?? []).some(
      (o) => o.label.toLowerCase() === q.toLowerCase() || o.value.toLowerCase() === q.toLowerCase(),
    );
  }

  private handleInputKeyDown(event: KeyboardEvent): void {
    if (this.isEffectivelyDisabled) return;

    if (event.key === 'Backspace' && this.multiple && this.queryText === '' && this.selectedList.length > 0) {
      event.preventDefault();
      this.syncSelectedList(this.selectedList.slice(0, -1), true);
      return;
    }

    if (event.key === 'ArrowDown' && !this.open) {
      event.preventDefault();
      void this.show();
      return;
    }

    if (event.key === 'Enter') {
      const active = this.listboxCtrl.activeOption;
      if (this.open && active) {
        event.preventDefault();
        if (active.element?.hasAttribute('data-create')) {
          this.createOptionFromQuery(this.queryText);
        } else {
          const opt = (this.options ?? []).find((o) => o.value === active.value);
          if (opt) this.selectOption(opt);
        }
        return;
      }
      if (this.canCreateQuery()) {
        event.preventDefault();
        this.createOptionFromQuery(this.queryText);
      }
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
    const filtered = this.getFilteredOptions();
    const showCreate = this.canCreateQuery();
    const hasLabel = Boolean(this.label || this.slottedLabelText);
    const hasHint = Boolean(this.hint || this.slottedHintText);
    const hasError = Boolean(this.error || this.slottedErrorText);
    const describedByIds: Array<string> = [];
    if (hasHint) describedByIds.push('mth-cs-hint');
    if (hasError) describedByIds.push('mth-cs-error');

    return html`
      <div part="base" class="base">
        <label id="mth-cs-label" for="mth-cs-input" part="label" class="label" ?hidden=${!hasLabel}>
          <slot name="label" @slotchange=${this.handleLabelSlotChange}>${this.label}</slot>
        </label>

        <div
          id="mth-cs-control"
          part="control"
          class="control"
          @click=${() => {
            if (!this.isEffectivelyDisabled) {
              this.inputEl?.focus();
              void this.show();
            }
          }}
        >
          ${this.multiple
            ? this.selectedList.map(
                (val) => html`
                  <span part="tag" class="tag">
                    <span>${this.resolveLabel(val)}</span>
                    <button
                      type="button"
                      part="tag-remove"
                      class="tag-remove"
                      aria-label="${creatableSelectMessages.removeTag} ${this.resolveLabel(val)}"
                      ?disabled=${this.isEffectivelyDisabled}
                      @click=${(e: Event) => {
                        e.stopPropagation();
                        this.syncSelectedList(
                          this.selectedList.filter((v) => v !== val),
                          true,
                        );
                      }}
                    >
                      ×
                    </button>
                  </span>
                `,
              )
            : nothing}

          <input
            id="mth-cs-input"
            part="input"
            class="input"
            type="text"
            role="combobox"
            aria-autocomplete="list"
            aria-expanded=${this.open ? 'true' : 'false'}
            aria-controls="mth-cs-listbox"
            aria-activedescendant=${ifDefined(this.open ? this.listboxCtrl.activeOption?.id : undefined)}
            aria-labelledby=${ifDefined(hasLabel ? 'mth-cs-label' : undefined)}
            aria-label=${ifDefined(!hasLabel ? this.label || creatableSelectMessages.defaultLabel : undefined)}
            aria-describedby=${ifDefined(describedByIds.length > 0 ? describedByIds.join(' ') : undefined)}
            .value=${this.queryText}
            placeholder=${!this.multiple || this.selectedList.length === 0 ? this.placeholder : ''}
            ?disabled=${this.isEffectivelyDisabled}
            @focus=${() => {
              if (!this.isEffectivelyDisabled && !this.open) void this.show();
            }}
            @input=${(e: Event) => {
              this.queryText = (e.target as HTMLInputElement).value;
              if (!this.open) void this.show();
            }}
            @keydown=${this.handleInputKeyDown}
          />

          ${(this.selectedList.length > 0 || this.queryText.length > 0) && !this.isEffectivelyDisabled
            ? html`
                <button
                  type="button"
                  part="clear"
                  class="clear-btn"
                  aria-label=${creatableSelectMessages.clearLabel}
                  @click=${(e: Event) => {
                    e.stopPropagation();
                    this.clear();
                  }}
                >
                  ×
                </button>
              `
            : nothing}
        </div>

        <div
          id="mth-cs-listbox"
          part="listbox"
          class="listbox"
          role="listbox"
          aria-multiselectable=${this.multiple ? 'true' : 'false'}
          aria-labelledby=${ifDefined(hasLabel ? 'mth-cs-label' : undefined)}
          aria-label=${ifDefined(!hasLabel ? this.label || creatableSelectMessages.defaultLabel : undefined)}
          tabindex="-1"
          data-open=${this.open ? 'true' : 'false'}
        >
          ${filtered.map((opt) => {
            const isSelected = this.selectedList.includes(opt.value);
            return html`
              <div
                part="option"
                class="option"
                role="option"
                data-value=${opt.value}
                aria-selected=${isSelected ? 'true' : 'false'}
                aria-disabled=${opt.disabled ? 'true' : 'false'}
                @click=${() => this.selectOption(opt)}
              >
                <span>${opt.label}</span>
                ${isSelected ? html`<span aria-hidden="true">✓</span>` : nothing}
              </div>
            `;
          })}

          ${showCreate
            ? html`
                <div
                  part="create-option"
                  class="option create-option"
                  role="option"
                  data-create="true"
                  data-value=${this.queryText.trim()}
                  aria-selected="false"
                  @click=${() => this.createOptionFromQuery(this.queryText)}
                >
                  ${creatableSelectMessages.createPrefix} "${this.queryText.trim()}"
                </div>
              `
            : filtered.length === 0
              ? html`<div class="empty">${creatableSelectMessages.emptyResults}</div>`
              : nothing}
        </div>

        <div id="mth-cs-hint" part="hint" class="hint" ?hidden=${!hasHint}>
          <slot name="hint" @slotchange=${this.handleHintSlotChange}>${this.hint}</slot>
        </div>

        <div id="mth-cs-error" part="error" class="error" role="alert" ?hidden=${!hasError}>
          <slot name="error" @slotchange=${this.handleErrorSlotChange}>${this.error}</slot>
        </div>
      </div>
    `;
  }
}
