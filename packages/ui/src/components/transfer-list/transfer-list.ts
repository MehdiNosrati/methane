import { UIElement, type PropertyValues } from '@methane/core';
import { FormControlController, ListboxController, SelectionController } from '@methane/primitives';
import { html, nothing } from 'lit';
import { property, state } from 'lit/decorators.js';
import { transferListMessages } from './transfer-list.messages.js';
import { transferListStyles } from './transfer-list.styles.js';

export interface TransferListItem {
  readonly key: string;
  readonly label: string;
  readonly description?: string;
  readonly disabled?: boolean;
}

export interface TransferListChangeDetail {
  readonly value: string;
  readonly targetKeys: ReadonlyArray<string>;
  readonly movedKeys: ReadonlyArray<string>;
  readonly direction: 'left' | 'right';
}

let transferListIdCounter = 0;

/**
 * `<mth-transfer-list>`: form-associated dual-pane shuttle transfer control with
 * search filtering, per-pane select-all, and directional move buttons.
 */
export class MthTransferList extends UIElement {
  static formAssociated = true;
  static override shadowRootOptions = { mode: 'open' as const, delegatesFocus: true };
  static override messages = transferListMessages;
  static override styles = transferListStyles;

  @property({ type: String, reflect: true })
  name = '';

  @property({ type: String })
  value = '';

  @property({ type: String, attribute: 'default-value' })
  defaultValue = '';

  @property({ attribute: false })
  options: ReadonlyArray<TransferListItem> | null = null;

  @property({ type: String })
  label = '';

  @property({ type: String, attribute: 'source-title' })
  sourceTitle = '';

  @property({ type: String, attribute: 'target-title' })
  targetTitle = '';

  @property({ type: String, attribute: 'search-placeholder' })
  searchPlaceholder = '';

  @property({ type: Boolean })
  searchable = true;

  @property({ type: String })
  hint = '';

  @property({ type: String })
  error = '';

  @property({ type: Boolean, reflect: true })
  disabled = false;

  @property({ type: Boolean, reflect: true })
  required = false;

  @state()
  private sourceQuery = '';

  @state()
  private targetQuery = '';

  @state()
  private formDisabled = false;

  private readonly uid = `mth-transfer-${++transferListIdCounter}`;
  private syncingValue = false;
  private activePane: 'source' | 'target' = 'source';
  private readonly formCtrl: FormControlController;
  private readonly sourceSelection: SelectionController<string>;
  private readonly targetSelection: SelectionController<string>;
  private readonly listboxCtrl: ListboxController;

  constructor() {
    super();

    this.formCtrl = new FormControlController(this, {
      internals: this.internals,
      defaultValue: this.defaultValue,
      required: this.required,
      disabled: this.disabled,
      messages: {
        ...transferListMessages,
        required: transferListMessages.requiredError,
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
        this.sourceSelection.setSelection([]);
        this.targetSelection.setSelection([]);
      },
      onDisabledChange: (isDisabled) => {
        this.formDisabled = isDisabled;
      },
    });

    this.sourceSelection = new SelectionController<string>(this, {
      mode: 'multiple',
      allowEmpty: true,
      onChange: () => {
        this.requestUpdate();
      },
    });

    this.targetSelection = new SelectionController<string>(this, {
      mode: 'multiple',
      allowEmpty: true,
      onChange: () => {
        this.requestUpdate();
      },
    });

    this.listboxCtrl = new ListboxController(this, {
      focusMode: 'activedescendant',
      multiple: true,
      loop: true,
      getListboxElement: () =>
        this.shadowRoot?.querySelector<HTMLElement>(`[data-pane="${this.activePane}"] [role="listbox"]`) ?? null,
      getOptionElements: () =>
        Array.from(
          this.shadowRoot?.querySelectorAll<HTMLElement>(`[data-pane="${this.activePane}"] [role="option"]`) ?? [],
        ),
      onSelectionChange: (selected) => {
        const ctrl = this.activePane === 'source' ? this.sourceSelection : this.targetSelection;
        ctrl.setSelection(selected);
        this.formCtrl.markTouched();
      },
    });
  }

  get isEffectivelyDisabled(): boolean {
    return this.disabled || this.formDisabled;
  }

  get targetKeys(): ReadonlyArray<string> {
    return this.parseKeys(this.value);
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

  protected override onFormDisabled(disabled: boolean): void {
    this.formCtrl.handleFormDisabled(disabled);
  }

  protected override onFormReset(): void {
    this.formCtrl.handleFormReset();
  }

  protected override onFormStateRestore(state: string | File | FormData | null, mode: 'restore' | 'autocomplete'): void {
    this.formCtrl.handleFormStateRestore(state, mode);
  }

  override connectedCallback(): void {
    super.connectedCallback();
    this.formCtrl.setDefaultValue(this.defaultValue || this.value);
    if (this.value) {
      this.formCtrl.setValue(this.value, { markDirty: false });
    }
    this.syncSelectionItems();
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
    }
    if (changed.has('error')) {
      this.formCtrl.validate();
    }
    if (changed.has('value') && !this.syncingValue) {
      this.formCtrl.setValue(this.value, { markDirty: false });
    }
    if (changed.has('options') || changed.has('value')) {
      this.syncSelectionItems();
    }
  }

  private parseKeys(raw: string): ReadonlyArray<string> {
    if (!raw) return [];
    return raw
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
  }

  private splitItems(): { source: ReadonlyArray<TransferListItem>; target: ReadonlyArray<TransferListItem> } {
    const all = this.options ?? [];
    const targetSet = new Set(this.targetKeys);
    const source: TransferListItem[] = [];
    const target: TransferListItem[] = [];
    for (const item of all) {
      if (targetSet.has(item.key)) {
        target.push(item);
      } else {
        source.push(item);
      }
    }
    return { source, target };
  }

  private syncSelectionItems(): void {
    const { source, target } = this.splitItems();
    this.sourceSelection.setItems(source.map((i) => i.key));
    this.targetSelection.setItems(target.map((i) => i.key));
  }

  private filterItems(items: ReadonlyArray<TransferListItem>, query: string): ReadonlyArray<TransferListItem> {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter(
      (item) => item.label.toLowerCase().includes(q) || (item.description?.toLowerCase().includes(q) ?? false),
    );
  }

  private moveItems(direction: 'left' | 'right', moveAll = false): void {
    if (this.isEffectivelyDisabled) return;
    const { source, target } = this.splitItems();
    const targetSet = new Set(this.targetKeys);
    const movedKeys: string[] = [];

    if (direction === 'right') {
      const checked = new Set(this.sourceSelection.selectedValues);
      const candidates = moveAll
        ? this.filterItems(source, this.sourceQuery).filter((i) => !i.disabled)
        : source.filter((i) => !i.disabled && checked.has(i.key));
      for (const item of candidates) {
        targetSet.add(item.key);
        movedKeys.push(item.key);
      }
      this.sourceSelection.setSelection([]);
    } else {
      const checked = new Set(this.targetSelection.selectedValues);
      const candidates = moveAll
        ? this.filterItems(target, this.targetQuery).filter((i) => !i.disabled)
        : target.filter((i) => !i.disabled && checked.has(i.key));
      for (const item of candidates) {
        targetSet.delete(item.key);
        movedKeys.push(item.key);
      }
      this.targetSelection.setSelection([]);
    }

    if (movedKeys.length === 0) return;

    const allOrdered = (this.options ?? []).map((i) => i.key).filter((k) => targetSet.has(k));
    const nextValue = allOrdered.join(',');
    this.syncingValue = true;
    this.value = nextValue;
    this.syncingValue = false;
    this.formCtrl.setValue(nextValue, { markDirty: true });
    this.formCtrl.markTouched();
    this.formCtrl.validate();

    this.dispatchEvent(
      new CustomEvent<TransferListChangeDetail>('mth-change', {
        bubbles: true,
        composed: true,
        detail: {
          value: nextValue,
          targetKeys: allOrdered,
          movedKeys,
          direction,
        },
      }),
    );
  }

  private togglePaneAll(pane: 'source' | 'target', visibleItems: ReadonlyArray<TransferListItem>, checked: boolean): void {
    if (this.isEffectivelyDisabled) return;
    const ctrl = pane === 'source' ? this.sourceSelection : this.targetSelection;
    const enabledKeys = visibleItems.filter((i) => !i.disabled).map((i) => i.key);
    const current = new Set(ctrl.selectedValues);
    if (checked) {
      for (const k of enabledKeys) current.add(k);
    } else {
      for (const k of enabledKeys) current.delete(k);
    }
    ctrl.setSelection(Array.from(current));
    this.formCtrl.markTouched();
  }

  private renderPane(
    pane: 'source' | 'target',
    title: string,
    allItems: ReadonlyArray<TransferListItem>,
    query: string,
    onQueryInput: (next: string) => void,
  ) {
    const visible = this.filterItems(allItems, query);
    const ctrl = pane === 'source' ? this.sourceSelection : this.targetSelection;
    const selectedSet = new Set(ctrl.selectedValues);
    const enabledVisible = visible.filter((i) => !i.disabled);
    const checkedCount = enabledVisible.filter((i) => selectedSet.has(i.key)).length;
    const allChecked = enabledVisible.length > 0 && checkedCount === enabledVisible.length;
    const searchPlaceholder = this.searchPlaceholder || this.t('searchPlaceholder');

    return html`
      <div class="pane" part="pane" data-pane=${pane}>
        <div class="pane-header" part="pane-header">
          <label class="pane-title-wrap">
            <input
              type="checkbox"
              aria-label=${`${this.t('selectAllLabel')} ${title}`}
              .checked=${allChecked}
              .indeterminate=${checkedCount > 0 && !allChecked}
              ?disabled=${this.isEffectivelyDisabled || enabledVisible.length === 0}
              @change=${(e: Event) => {
                const input = e.currentTarget as HTMLInputElement;
                this.togglePaneAll(pane, visible, input.checked);
              }}
            />
            <span>${title}</span>
          </label>
          <span class="pane-count">${`${ctrl.selectedValues.length}/${allItems.length}`}</span>
        </div>

        ${this.searchable
          ? html`
              <div class="search-wrap">
                <input
                  type="search"
                  class="search"
                  part="search"
                  aria-label=${`${title} ${searchPlaceholder}`}
                  placeholder=${searchPlaceholder}
                  .value=${query}
                  ?disabled=${this.isEffectivelyDisabled}
                  @input=${(e: Event) => {
                    onQueryInput((e.currentTarget as HTMLInputElement).value);
                  }}
                />
              </div>
            `
          : nothing}

        <ul
          class="list"
          part="list"
          role="listbox"
          tabindex=${pane === this.activePane ? 0 : -1}
          aria-multiselectable="true"
          aria-label=${title}
          @focusin=${() => {
            if (this.activePane !== pane) {
              this.activePane = pane;
            }
          }}
        >
          ${visible.length === 0
            ? html`<li class="empty">${this.t('emptyText')}</li>`
            : visible.map((item, idx) => {
                const itemDisabled = this.isEffectivelyDisabled || Boolean(item.disabled);
                const isChecked = selectedSet.has(item.key);
                return html`
                  <li
                    id=${`${this.uid}-${pane}-opt-${idx}`}
                    role="option"
                    data-value=${item.key}
                    aria-selected=${isChecked ? 'true' : 'false'}
                    aria-disabled=${itemDisabled ? 'true' : 'false'}
                  >
                    <label class="item" part="item" data-key=${item.key} data-disabled=${itemDisabled ? 'true' : 'false'}>
                      <input
                        type="checkbox"
                        .checked=${isChecked}
                        ?disabled=${itemDisabled}
                        @change=${() => {
                          this.activePane = pane;
                          ctrl.select(item.key, { toggle: true });
                          this.listboxCtrl.setSelectedValues(ctrl.selectedValues);
                          this.formCtrl.markTouched();
                        }}
                      />
                      <span>${item.label}</span>
                    </label>
                  </li>
                `;
              })}
        </ul>
      </div>
    `;
  }

  protected override render() {
    const labelId = `${this.uid}-label`;
    const hintId = `${this.uid}-hint`;
    const errorId = `${this.uid}-error`;
    const ctx = this.formCtrl.fieldContext;
    const effLabel = this.label || ctx?.label || '';
    const effHint = this.hint || ctx?.hint || '';
    const rawError = this.error || ctx?.error || '';
    const effectiveError = rawError || (this.invalid ? this.validationMessage : '');
    const describedBy = [effHint ? hintId : '', effectiveError ? errorId : ''].filter(Boolean).join(' ') || undefined;

    const effSourceTitle = this.sourceTitle || this.t('sourceTitle');
    const effTargetTitle = this.targetTitle || this.t('targetTitle');
    const { source, target } = this.splitItems();
    const isRtl = this.resolvedDir === 'rtl';

    const hasMovableSource = this.filterItems(source, this.sourceQuery).some((i) => !i.disabled);
    const hasMovableTarget = this.filterItems(target, this.targetQuery).some((i) => !i.disabled);

    return html`
      <div
        class="base"
        part="base"
        role="group"
        aria-labelledby=${effLabel ? labelId : nothing}
        aria-describedby=${describedBy ?? nothing}
      >
        ${effLabel
          ? html`<div class="label" part="label" id=${labelId}>
              <slot name="label">${effLabel}</slot>
            </div>`
          : html`<slot name="label"></slot>`}

        <div class="panes" part="panes">
          ${this.renderPane('source', effSourceTitle, source, this.sourceQuery, (q) => {
            this.sourceQuery = q;
          })}

          <div class="actions" part="actions">
            <button
              type="button"
              class="action-button"
              part="action-button"
              data-action="move-all-right"
              aria-label=${this.t('moveAllRightLabel')}
              ?disabled=${this.isEffectivelyDisabled || !hasMovableSource}
              @click=${() => this.moveItems('right', true)}
            >
              ${isRtl ? '«' : '»'}
            </button>
            <button
              type="button"
              class="action-button"
              part="action-button"
              data-action="move-right"
              aria-label=${this.t('moveRightLabel')}
              ?disabled=${this.isEffectivelyDisabled || this.sourceSelection.selectedValues.length === 0}
              @click=${() => this.moveItems('right', false)}
            >
              ${isRtl ? '‹' : '›'}
            </button>
            <button
              type="button"
              class="action-button"
              part="action-button"
              data-action="move-left"
              aria-label=${this.t('moveLeftLabel')}
              ?disabled=${this.isEffectivelyDisabled || this.targetSelection.selectedValues.length === 0}
              @click=${() => this.moveItems('left', false)}
            >
              ${isRtl ? '›' : '‹'}
            </button>
            <button
              type="button"
              class="action-button"
              part="action-button"
              data-action="move-all-left"
              aria-label=${this.t('moveAllLeftLabel')}
              ?disabled=${this.isEffectivelyDisabled || !hasMovableTarget}
              @click=${() => this.moveItems('left', true)}
            >
              ${isRtl ? '»' : '«'}
            </button>
          </div>

          ${this.renderPane('target', effTargetTitle, target, this.targetQuery, (q) => {
            this.targetQuery = q;
          })}
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
