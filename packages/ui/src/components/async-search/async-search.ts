import { UIElement, type PropertyValues } from '@methane/core';
import {
  DataController,
  FormControlController,
  ListboxController,
  OverlayController,
  PositioningController,
  type DataControllerStatus,
  type DataSource,
} from '@methane/primitives';
import { html, nothing } from 'lit';
import { property, query, state } from 'lit/decorators.js';
import { ifDefined } from 'lit/directives/if-defined.js';
import { asyncSearchMessages } from './async-search.messages.js';
import { asyncSearchStyles } from './async-search.styles.js';

export interface AsyncSearchOption {
  readonly id?: string;
  readonly value?: string;
  readonly label: string;
  readonly disabled?: boolean;
}

/**
 * `<mth-async-search>`: form-associated async combobox backed by `DataController`
 * with abortable requests, debounced input search, explicit loading/empty/error states,
 * and top-layer listbox navigation.
 */
export class MthAsyncSearch extends UIElement {
  static formAssociated = true;
  static override shadowRootOptions = { mode: 'open' as const, delegatesFocus: true };
  static override messages = asyncSearchMessages;
  static override styles = asyncSearchStyles;

  @property({ type: String, reflect: true })
  name = '';

  @property({ type: String })
  value = '';

  @property({ type: String, attribute: 'default-value' })
  defaultValue = '';

  @property({ attribute: false })
  dataSource: DataSource<AsyncSearchOption, string> | null = null;

  @property({ attribute: false })
  options: ReadonlyArray<AsyncSearchOption> = [];

  @property({ type: Number, attribute: 'debounce-ms' })
  debounceMs = 200;

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

  @state()
  private queryText = '';

  @state()
  private slottedLabelText = '';

  @state()
  private slottedHintText = '';

  @state()
  private slottedErrorText = '';

  @query('#mth-as-control')
  private controlEl!: HTMLElement | null;

  @query('#mth-as-input')
  private inputEl!: HTMLInputElement | null;

  @query('#mth-as-listbox')
  private listboxEl!: HTMLElement | null;

  private readonly formCtrl: FormControlController;
  private readonly dataCtrl: DataController<AsyncSearchOption, string>;
  private readonly listboxCtrl: ListboxController;
  private readonly overlayCtrl: OverlayController;
  private readonly positionCtrl: PositioningController;
  private debounceTimer: ReturnType<typeof setTimeout> | null = null;
  private syncingValue = false;

  constructor() {
    super();

    this.formCtrl = new FormControlController(this, {
      internals: this.internals,
      defaultValue: '',
      messages: asyncSearchMessages,
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

    this.dataCtrl = new DataController<AsyncSearchOption, string>(this, {
      autoLoad: false,
    });

    this.listboxCtrl = new ListboxController(this, {
      focusMode: 'activedescendant',
      multiple: false,
      loop: true,
      getListboxElement: () => this.listboxEl,
      getOptionElements: () =>
        Array.from(this.shadowRoot?.querySelectorAll<HTMLElement>('[role="option"]') ?? []),
      onSelectionChange: (selected) => {
        const nextVal = selected[0] ?? '';
        const item = this.resolveCurrentItems().find((o) => this.resolveItemValue(o) === nextVal) ?? null;
        this.selectItem(nextVal, item, true);
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

  get dataStatus(): DataControllerStatus {
    return this.dataCtrl.status;
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

  override disconnectedCallback(): void {
    if (this.debounceTimer !== null) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
    }
    super.disconnectedCallback();
  }

  override willUpdate(changed: PropertyValues<this>): void {
    super.willUpdate(changed);

    if (changed.has('defaultValue')) {
      this.formCtrl.setDefaultValue(this.defaultValue);
    }

    if (changed.has('dataSource')) {
      this.dataCtrl.setDataSource(this.dataSource, { load: false });
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

  async query(queryText: string): Promise<void> {
    this.queryText = queryText;
    this.dispatchEvent(
      new CustomEvent('mth-search', {
        detail: { query: queryText },
        bubbles: true,
        composed: true,
      }),
    );
    await this.dataCtrl.setFilter(queryText);
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
    this.selectItem('', null, true);
  }

  private resolveItemValue(item: AsyncSearchOption): string {
    return item.value ?? item.id ?? item.label;
  }

  private resolveCurrentItems(): ReadonlyArray<AsyncSearchOption> {
    if (this.dataSource) {
      return this.dataCtrl.items;
    }
    const q = this.queryText.trim().toLowerCase();
    if (!q) return this.options;
    return this.options.filter(
      (o) => o.label.toLowerCase().includes(q) || this.resolveItemValue(o).toLowerCase().includes(q),
    );
  }

  private applyValueString(raw: string): void {
    const item = this.resolveCurrentItems().find((o) => this.resolveItemValue(o) === raw) ?? null;
    this.syncingValue = true;
    this.value = raw;
    this.queryText = item ? item.label : raw;
    this.listboxCtrl.setSelectedValues(raw ? [raw] : []);
    this.formCtrl.setValue(raw, { markDirty: false });
    this.syncingValue = false;
  }

  private selectItem(nextVal: string, item: AsyncSearchOption | null, fromUser: boolean): void {
    if (item?.disabled) return;
    this.syncingValue = true;
    this.value = nextVal;
    this.queryText = item ? item.label : '';
    this.listboxCtrl.setSelectedValues(nextVal ? [nextVal] : []);
    this.formCtrl.setValue(nextVal, { markDirty: fromUser });
    this.syncingValue = false;

    if (fromUser) {
      void this.hide();
      this.dispatchEvent(
        new CustomEvent('mth-change', {
          detail: { value: nextVal, item },
          bubbles: true,
          composed: true,
        }),
      );
    }
  }

  private scheduleSearch(text: string): void {
    if (this.debounceTimer !== null) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
    }
    if (!this.dataSource) return;
    if (this.debounceMs <= 0) {
      void this.query(text);
      return;
    }
    this.debounceTimer = setTimeout(() => {
      this.debounceTimer = null;
      void this.query(text);
    }, this.debounceMs);
  }

  private handleInputKeyDown(event: KeyboardEvent): void {
    if (this.isEffectivelyDisabled) return;
    if (event.key === 'ArrowDown' && !this.open) {
      event.preventDefault();
      void this.show();
      return;
    }
    if (event.key === 'Enter' && this.open && this.listboxCtrl.activeOption) {
      event.preventDefault();
      const val = this.listboxCtrl.activeOption.value;
      const item = this.resolveCurrentItems().find((o) => this.resolveItemValue(o) === val) ?? null;
      this.selectItem(val, item, true);
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
    const items = this.resolveCurrentItems();
    const status = this.dataSource ? this.dataCtrl.status : items.length === 0 ? 'empty' : 'ready';
    const ctx = this.formCtrl.fieldContext;
    const effLabel = this.label || this.slottedLabelText || ctx?.label || '';
    const effHint = this.hint || this.slottedHintText || ctx?.hint || '';
    const rawError = this.error || this.slottedErrorText || ctx?.error || '';
    const hasLabel = Boolean(effLabel);
    const hasHint = Boolean(effHint);
    const hasError = Boolean(rawError);
    const describedByIds: Array<string> = [];
    if (hasHint) describedByIds.push('mth-as-hint');
    if (hasError) describedByIds.push('mth-as-error');
    const renderedIds = items.map((_, idx) => `mth-as-opt-${idx}`);
    const candidateActiveId = this.listboxCtrl.activeOption?.id;
    const activeId = this.open && candidateActiveId && renderedIds.includes(candidateActiveId) ? candidateActiveId : undefined;
    const effPlaceholder = this.placeholder || this.t('placeholder');

    return html`
      <div part="base" class="base">
        <label id="mth-as-label" for="mth-as-input" part="label" class="label" ?hidden=${!hasLabel}>
          <slot name="label" @slotchange=${this.handleLabelSlotChange}>${effLabel}</slot>
        </label>

        <div id="mth-as-control" part="control" class="control">
          <input
            id="mth-as-input"
            part="input"
            class="input"
            type="text"
            role="combobox"
            aria-autocomplete="list"
            aria-expanded=${this.open ? 'true' : 'false'}
            aria-controls="mth-as-listbox"
            aria-activedescendant=${ifDefined(activeId)}
            aria-labelledby=${ifDefined(hasLabel ? 'mth-as-label' : undefined)}
            aria-label=${ifDefined(!hasLabel ? this.t('defaultLabel') : undefined)}
            aria-describedby=${ifDefined(describedByIds.length > 0 ? describedByIds.join(' ') : undefined)}
            .value=${this.queryText}
            placeholder=${effPlaceholder}
            ?disabled=${this.isEffectivelyDisabled}
            @focus=${() => {
              if (!this.isEffectivelyDisabled && !this.open) void this.show();
            }}
            @input=${(e: Event) => {
              const nextText = (e.target as HTMLInputElement).value;
              this.queryText = nextText;
              if (!this.open) void this.show();
              this.scheduleSearch(nextText);
            }}
            @keydown=${this.handleInputKeyDown}
          />

          ${(this.value.length > 0 || this.queryText.length > 0) && !this.isEffectivelyDisabled
            ? html`
                <button
                  type="button"
                  part="clear"
                  class="clear-btn"
                  aria-label=${this.t('clearLabel')}
                  @click=${() => this.clear()}
                >
                  ×
                </button>
              `
            : nothing}
        </div>

        <div
          id="mth-as-listbox"
          part="listbox"
          class="listbox"
          role="listbox"
          aria-labelledby=${ifDefined(hasLabel ? 'mth-as-label' : undefined)}
          aria-label=${ifDefined(!hasLabel ? this.t('defaultLabel') : undefined)}
          tabindex="-1"
          data-open=${this.open ? 'true' : 'false'}
        >
          ${status === 'loading' || status === 'refreshing'
            ? html`<div part="status" class="status" data-status=${status}>${this.t('loading')}</div>`
            : status === 'error'
              ? html`<div part="status" class="status" data-status="error">${this.t('errorMessage')}</div>`
              : nothing}

          ${items.map((opt, idx) => {
            const val = this.resolveItemValue(opt);
            const isSelected = this.value === val;
            return html`
              <div
                id=${`mth-as-opt-${idx}`}
                part="option"
                class="option"
                role="option"
                data-value=${val}
                aria-selected=${isSelected ? 'true' : 'false'}
                aria-disabled=${opt.disabled ? 'true' : 'false'}
                @click=${() => this.selectItem(val, opt, true)}
              >
                <span>${opt.label}</span>
                ${isSelected ? html`<span aria-hidden="true">✓</span>` : nothing}
              </div>
            `;
          })}

          ${items.length === 0 && (status === 'empty' || status === 'ready')
            ? html`<div part="status" class="status" data-status="empty">${this.t('emptyResults')}</div>`
            : nothing}
        </div>

        <div id="mth-as-hint" part="hint" class="hint" ?hidden=${!hasHint}>
          <slot name="hint" @slotchange=${this.handleHintSlotChange}>${effHint}</slot>
        </div>

        <div id="mth-as-error" part="error" class="error" role="alert" ?hidden=${!hasError}>
          <slot name="error" @slotchange=${this.handleErrorSlotChange}>${rawError}</slot>
        </div>
      </div>
    `;
  }
}
