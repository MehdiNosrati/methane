import { UIElement, type PropertyValues } from '@methane-ui/core';
import {
  FormControlController,
  ListboxController,
  OverlayController,
  PositioningController,
  SelectionController,
} from '@methane-ui/primitives';
import { html, nothing } from 'lit';
import { property, query, state } from 'lit/decorators.js';
import { ifDefined } from 'lit/directives/if-defined.js';
import { multiSelectMessages } from './multi-select.messages.js';
import { multiSelectStyles } from './multi-select.styles.js';

export interface MultiSelectOption {
  readonly value: string;
  readonly label: string;
  readonly disabled?: boolean;
  readonly group?: string;
}

/**
 * `<mth-multi-select>`: form-associated multi-select combobox with tag chips,
 * search filtering, keyboard navigation, and top-layer listbox overlay.
 */
export class MthMultiSelect extends UIElement {
  static formAssociated = true;
  static override shadowRootOptions = { mode: 'open' as const, delegatesFocus: true };
  static override messages = multiSelectMessages;
  static override styles = multiSelectStyles;

  @property({ type: String, reflect: true })
  name = '';

  @property({ type: String })
  value = '';

  @property({ type: String, attribute: 'default-value' })
  defaultValue = '';

  @property({ attribute: false })
  options: ReadonlyArray<MultiSelectOption> | null = null;

  @property({ type: String })
  label = '';

  @property({ type: String })
  placeholder = '';

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

  @property({ type: Number, attribute: 'max-selections' })
  maxSelections = 0;

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

  @query('#mth-ms-control')
  private controlEl!: HTMLElement | null;

  @query('#mth-ms-input')
  private inputEl!: HTMLInputElement | null;

  @query('#mth-ms-listbox')
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
      messages: multiSelectMessages,
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

    this.selectionCtrl = new SelectionController<string>(this, {
      mode: 'multiple',
      allowEmpty: true,
      onChange: (selected) => {
        if (this.syncingValue) return;
        const nextList = [...selected];
        const limited = this.maxSelections > 0 ? nextList.slice(0, this.maxSelections) : nextList;
        this.syncSelectedList(limited, true);
      },
    });

    this.listboxCtrl = new ListboxController(this, {
      focusMode: 'activedescendant',
      multiple: true,
      loop: true,
      getListboxElement: () => this.listboxEl,
      getOptionElements: () =>
        Array.from(this.shadowRoot?.querySelectorAll<HTMLElement>('[role="option"]') ?? []),
      onSelectionChange: (selected) => {
        const nextList = [...selected];
        const limited = this.maxSelections > 0 ? nextList.slice(0, this.maxSelections) : nextList;
        this.syncSelectedList(limited, true);
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
        if (isOpen) {
          this.positionCtrl.reposition();
        }
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

    if (changed.has('options')) {
      this.selectionCtrl.setItems(
        (this.options ?? []).map((opt) => ({ value: opt.value, disabled: Boolean(opt.disabled) })),
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
    this.syncSelectedList([], true);
  }

  private applyValueString(raw: string): void {
    const parsed = raw
      .split(',')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
    this.syncSelectedList(parsed, false);
  }

  private syncSelectedList(next: Array<string>, fromUser: boolean): void {
    this.syncingValue = true;
    this.selectedList = next;
    const joined = next.join(',');
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

  private toggleOption(option: MultiSelectOption): void {
    if (this.isEffectivelyDisabled || option.disabled) return;
    const exists = this.selectedList.includes(option.value);
    let next: Array<string>;
    if (exists) {
      next = this.selectedList.filter((v) => v !== option.value);
    } else {
      if (this.maxSelections > 0 && this.selectedList.length >= this.maxSelections) {
        return;
      }
      next = [...this.selectedList, option.value];
    }
    this.syncSelectedList(next, true);
    this.queryText = '';
    this.inputEl?.focus();
  }

  private removeValue(val: string): void {
    if (this.isEffectivelyDisabled) return;
    this.syncSelectedList(
      this.selectedList.filter((v) => v !== val),
      true,
    );
  }

  private getFilteredOptions(): Array<MultiSelectOption> {
    const list = this.options ?? [];
    const q = this.queryText.trim().toLowerCase();
    if (!q) return [...list];
    return list.filter(
      (opt) => opt.label.toLowerCase().includes(q) || opt.value.toLowerCase().includes(q),
    );
  }

  private resolveOptionLabel(val: string): string {
    return (this.options ?? []).find((opt) => opt.value === val)?.label ?? val;
  }

  private handleInputKeyDown(event: KeyboardEvent): void {
    if (this.isEffectivelyDisabled) return;

    if (event.key === 'Backspace' && this.queryText === '' && this.selectedList.length > 0) {
      event.preventDefault();
      this.syncSelectedList(this.selectedList.slice(0, -1), true);
      return;
    }

    if (event.key === 'ArrowDown' && !this.open) {
      event.preventDefault();
      void this.show();
      return;
    }

    if (event.key === 'ArrowDown' || event.key === 'ArrowUp' || event.key === 'Enter') {
      if (this.open && this.listboxEl) {
        if (event.key === 'Enter' && this.listboxCtrl.activeOption) {
          event.preventDefault();
          const opt = (this.options ?? []).find((o) => o.value === this.listboxCtrl.activeOption?.value);
          if (opt) this.toggleOption(opt);
        }
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

  override updated(changed: PropertyValues<this>): void {
    const lbActive = this.listboxEl?.getAttribute('aria-activedescendant');
    if (lbActive && (!this.open || !this.shadowRoot?.getElementById(lbActive))) {
      this.listboxEl?.removeAttribute('aria-activedescendant');
    }
    super.updated(changed);
  }

  override render() {
    const filtered = this.getFilteredOptions();
    const ctx = this.formCtrl.fieldContext;
    const effLabel = this.label || this.slottedLabelText || ctx?.label || '';
    const effHint = this.hint || this.slottedHintText || ctx?.hint || '';
    const rawError = this.error || this.slottedErrorText || ctx?.error || '';
    const hasLabel = Boolean(effLabel);
    const hasHint = Boolean(effHint);
    const hasError = Boolean(rawError);
    const describedByIds: Array<string> = [];
    if (hasHint) describedByIds.push('mth-ms-hint');
    if (hasError) describedByIds.push('mth-ms-error');
    const renderedIds = filtered.map((_, idx) => `mth-ms-opt-${idx}`);
    const candidateActiveId = this.listboxCtrl.activeOption?.id;
    const activeId = this.open && candidateActiveId && renderedIds.includes(candidateActiveId) ? candidateActiveId : undefined;
    const effPlaceholder = this.placeholder || this.t('placeholder');

    return html`
      <div part="base" class="base">
        <label id="mth-ms-label" for="mth-ms-input" part="label" class="label" ?hidden=${!hasLabel}>
          <slot name="label" @slotchange=${this.handleLabelSlotChange}>${effLabel}</slot>
        </label>

        <div
          id="mth-ms-control"
          part="control"
          class="control"
          @click=${() => {
            if (!this.isEffectivelyDisabled) {
              this.inputEl?.focus();
              void this.show();
            }
          }}
        >
          ${this.selectedList.map(
            (val) => html`
              <span part="tag" class="tag">
                <span>${this.resolveOptionLabel(val)}</span>
                <button
                  type="button"
                  part="tag-remove"
                  class="tag-remove"
                  aria-label="${this.t('removeTag')} ${this.resolveOptionLabel(val)}"
                  ?disabled=${this.isEffectivelyDisabled}
                  @click=${(e: Event) => {
                    e.stopPropagation();
                    this.removeValue(val);
                  }}
                >
                  ×
                </button>
              </span>
            `,
          )}

          <input
            id="mth-ms-input"
            part="input"
            class="input"
            type="text"
            role="combobox"
            aria-autocomplete="list"
            aria-expanded=${this.open ? 'true' : 'false'}
            aria-controls="mth-ms-listbox"
            aria-activedescendant=${ifDefined(activeId)}
            aria-labelledby=${ifDefined(hasLabel ? 'mth-ms-label' : undefined)}
            aria-label=${ifDefined(!hasLabel ? this.t('defaultLabel') : undefined)}
            aria-describedby=${ifDefined(describedByIds.length > 0 ? describedByIds.join(' ') : undefined)}
            .value=${this.queryText}
            placeholder=${this.selectedList.length === 0 ? effPlaceholder : ''}
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

          ${this.selectedList.length > 0 && !this.isEffectivelyDisabled
            ? html`
                <button
                  type="button"
                  part="clear"
                  class="clear-btn"
                  aria-label=${this.t('clearAll')}
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
          id="mth-ms-listbox"
          part="listbox"
          class="listbox"
          role="listbox"
          aria-multiselectable="true"
          aria-labelledby=${ifDefined(hasLabel ? 'mth-ms-label' : undefined)}
          aria-label=${ifDefined(!hasLabel ? this.t('defaultLabel') : undefined)}
          tabindex="-1"
          data-open=${this.open ? 'true' : 'false'}
        >
          ${filtered.length === 0
            ? html`<div class="empty">${this.t('emptyResults')}</div>`
            : filtered.map((opt, idx) => {
                const isSelected = this.selectedList.includes(opt.value);
                return html`
                  <div
                    id=${`mth-ms-opt-${idx}`}
                    part="option"
                    class="option"
                    role="option"
                    data-value=${opt.value}
                    aria-selected=${isSelected ? 'true' : 'false'}
                    aria-disabled=${opt.disabled ? 'true' : 'false'}
                    @click=${() => this.toggleOption(opt)}
                  >
                    <span>${opt.label}</span>
                    ${isSelected ? html`<span aria-hidden="true">✓</span>` : nothing}
                  </div>
                `;
              })}
        </div>

        <div id="mth-ms-hint" part="hint" class="hint" ?hidden=${!hasHint}>
          <slot name="hint" @slotchange=${this.handleHintSlotChange}>${effHint}</slot>
        </div>

        <div id="mth-ms-error" part="error" class="error" role="alert" ?hidden=${!hasError}>
          <slot name="error" @slotchange=${this.handleErrorSlotChange}>${rawError}</slot>
        </div>
      </div>
    `;
  }
}
