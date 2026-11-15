import { UIElement, type PropertyValues } from '@methane/core';
import { DragSortController, FormControlController } from '@methane/primitives';
import { html, nothing } from 'lit';
import { property, state } from 'lit/decorators.js';
import { formRepeaterMessages } from './form-repeater.messages.js';
import { formRepeaterStyles } from './form-repeater.styles.js';

export interface RepeaterFieldSchema {
  readonly name: string;
  readonly label?: string;
  readonly type?: 'text' | 'email' | 'number' | 'url';
  readonly placeholder?: string;
}

export type RepeaterRow = Record<string, string>;

function parseRows(raw: string): RepeaterRow[] {
  if (!raw || raw.trim().length === 0) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (Array.isArray(parsed)) {
      return parsed.map((entry) => {
        if (entry && typeof entry === 'object' && !Array.isArray(entry)) {
          const out: RepeaterRow = {};
          for (const [k, v] of Object.entries(entry as Record<string, unknown>)) {
            out[k] = v === undefined || v === null ? '' : String(v);
          }
          return out;
        }
        return { value: entry === undefined || entry === null ? '' : String(entry) };
      });
    }
  } catch {
    // Plain non-JSON fallback string wraps as single item.
  }
  return [{ value: raw }];
}

function serializeRows(rows: ReadonlyArray<RepeaterRow>): string {
  if (rows.length === 0) return '';
  return JSON.stringify(rows);
}

/**
 * `<mth-form-repeater>`: form-associated dynamic row list supporting add/remove,
 * min/max cardinality constraints, and `DragSortController` reordering.
 */
export class MthFormRepeater extends UIElement {
  static formAssociated = true;
  static override shadowRootOptions = { mode: 'open' as const, delegatesFocus: true };
  static override messages = formRepeaterMessages;
  static override styles = formRepeaterStyles;

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

  @property({ type: Number })
  min = 0;

  @property({ type: Number })
  max: number | undefined = undefined;

  @property({ type: Boolean, reflect: true })
  reorderable = true;

  @property({ type: String, attribute: 'add-label' })
  addLabel = '';

  @property({ attribute: false })
  fields: ReadonlyArray<RepeaterFieldSchema> = [];

  @property({ type: Boolean, reflect: true })
  disabled = false;

  @property({ type: Boolean, reflect: true })
  required = false;

  @property({ type: Boolean, reflect: true })
  readonly = false;

  @state()
  private rows: RepeaterRow[] = [];

  @state()
  private slottedLabelText = '';

  @state()
  private slottedHintText = '';

  @state()
  private slottedErrorText = '';

  private readonly formCtrl: FormControlController;
  private readonly dragSort: DragSortController<HTMLElement>;

  constructor() {
    super();
    this.formCtrl = new FormControlController(this, {
      internals: this.internals,
      defaultValue: '',
      messages: formRepeaterMessages,
      onValueSync: (nextValue) => {
        this.value = nextValue;
        this.rows = parseRows(nextValue);
      },
      onDisabledChange: () => {
        this.requestUpdate();
      },
      onSetCustomState: (stateName, active) => {
        this.setCustomState(stateName, active);
      },
      validator: ({ value }) => {
        if (this.error.length > 0) {
          return { flags: { customError: true }, message: this.error };
        }
        const parsed = parseRows(typeof value === 'string' ? value : '');
        if (this.min > 0 && parsed.length < this.min) {
          return {
            flags: { rangeUnderflow: true },
            message: this.t('minRowsViolation', { min: this.min }),
          };
        }
        return null;
      },
    });

    this.dragSort = new DragSortController<HTMLElement>(this, {
      orientation: 'vertical',
      getItems: () =>
        Array.from(this.shadowRoot?.querySelectorAll<HTMLElement>('[part="row"]') ?? []),
      onReorder: ({ fromIndex, toIndex }) => {
        this.applyReorder(fromIndex, toIndex);
      },
    });
  }

  get validity(): ValidityState | undefined {
    return this.internals?.validity;
  }

  get validityFlags() {
    return this.formCtrl.validityFlags;
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

  get items(): ReadonlyArray<RepeaterRow> {
    return this.rows.map((r) => ({ ...r }));
  }

  set items(next: ReadonlyArray<RepeaterRow>) {
    this.rows = next.map((r) => ({ ...r }));
    this.value = serializeRows(this.rows);
  }

  override focus(options?: FocusOptions): void {
    const firstCtrl = this.shadowRoot?.querySelector<HTMLElement>('[part="control"], [part="add"]');
    firstCtrl?.focus(options);
  }

  checkValidity(): boolean {
    return this.formCtrl.checkValidity();
  }

  reportValidity(): boolean {
    return this.formCtrl.reportValidity();
  }

  addRow(initial?: RepeaterRow): void {
    if (this.formCtrl.disabled || this.formCtrl.readOnly) return;
    if (this.max !== undefined && Number.isFinite(this.max) && this.rows.length >= this.max) return;
    const row: RepeaterRow = initial ? { ...initial } : {};
    for (const schema of this.resolveSchemas()) {
      if (!(schema.name in row)) {
        row[schema.name] = '';
      }
    }
    const nextRows = [...this.rows, row];
    this.commitRows(nextRows);
    this.emitEvent('mth-add', { detail: { index: nextRows.length - 1, row: { ...row } } });
  }

  removeRow(index: number): void {
    if (this.formCtrl.disabled || this.formCtrl.readOnly) return;
    if (index < 0 || index >= this.rows.length || this.rows.length <= this.min) return;
    const removed = this.rows[index]!;
    const nextRows = this.rows.filter((_, idx) => idx !== index);
    this.commitRows(nextRows);
    this.emitEvent('mth-remove', { detail: { index, row: { ...removed } } });
  }

  moveRow(fromIndex: number, toIndex: number): void {
    if (!this.reorderable || this.formCtrl.disabled || this.formCtrl.readOnly) return;
    this.dragSort.reorder(fromIndex, toIndex);
  }

  protected override onFirstConnect(): void {
    const initialDefault = this.getAttribute('value') ?? this.value ?? '';
    this.formCtrl.setDefaultValue(initialDefault);
    this.rows = parseRows(this.value);
    this.formCtrl.setValue(this.value, { markDirty: false });
  }

  protected override onFormDisabled(disabled: boolean): void {
    this.formCtrl.handleFormDisabled(disabled);
  }

  protected override onFormReset(): void {
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
      this.rows = parseRows(this.value);
      if (this.formCtrl.value !== this.value) {
        this.formCtrl.setValue(this.value, { markDirty: false });
      }
    }
    if (changedProperties.has('error') || changedProperties.has('min')) {
      this.formCtrl.validate();
    }

    this.setCustomState('required', this.formCtrl.required);
    this.setCustomState('readonly', this.formCtrl.readOnly);
  }

  private resolveSchemas(): ReadonlyArray<RepeaterFieldSchema> {
    if (this.fields.length > 0) return this.fields;
    return [{ name: 'value', label: this.t('defaultFieldLabel'), type: 'text' }];
  }

  private applyReorder(fromIndex: number, toIndex: number): void {
    if (
      fromIndex < 0 ||
      toIndex < 0 ||
      fromIndex >= this.rows.length ||
      toIndex >= this.rows.length ||
      fromIndex === toIndex
    ) {
      return;
    }
    const nextRows = [...this.rows];
    const [moved] = nextRows.splice(fromIndex, 1);
    if (moved) {
      nextRows.splice(toIndex, 0, moved);
      this.commitRows(nextRows);
    }
  }

  private commitRows(nextRows: RepeaterRow[]): void {
    this.rows = nextRows;
    const serialized = serializeRows(nextRows);
    this.value = serialized;
    this.formCtrl.setValue(serialized, { markDirty: true });
    this.emitEvent('mth-input', { detail: { value: serialized, items: this.items } });
    this.emitEvent('mth-change', { detail: { value: serialized, items: this.items } });
  }

  private handleCellInput(rowIndex: number, fieldName: string, event: Event): void {
    if (this.formCtrl.disabled || this.formCtrl.readOnly) return;
    const input = event.target as HTMLInputElement;
    const nextRows = this.rows.map((row, idx) =>
      idx === rowIndex ? { ...row, [fieldName]: input.value } : row,
    );
    this.rows = nextRows;
    const serialized = serializeRows(nextRows);
    this.value = serialized;
    this.formCtrl.setValue(serialized, { markDirty: true });
    this.emitEvent('mth-input', { detail: { value: serialized, items: this.items } });
  }

  private handleCellChange(): void {
    this.emitEvent('mth-change', { detail: { value: this.value, items: this.items } });
  }

  private readonly handleGroupFocusOut = (event: FocusEvent): void => {
    const related = event.relatedTarget as Node | null;
    if (!related || !this.shadowRoot?.contains(related)) {
      this.formCtrl.markTouched();
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
    const schemas = this.resolveSchemas();
    const canAdd =
      !isDisabled &&
      !isReadonly &&
      (this.max === undefined || !Number.isFinite(this.max) || this.rows.length < this.max);
    const canRemove = !isDisabled && !isReadonly && this.rows.length > this.min;

    return html`
      <fieldset
        part="base"
        class="fieldset"
        aria-describedby=${hasHint && !hasError ? 'mth-rep-hint' : nothing}
        @focusout=${this.handleGroupFocusOut}
      >
        <legend
          part="label"
          class=${hasFieldContext ? 'legend sr-only' : 'legend'}
          ?hidden=${!hasLabel}
        >
          <slot
            name="label"
            @slotchange=${(ev: Event) => this.handleTextSlotChange('label', ev)}
          >${effectiveLabel || this.t('defaultLabel')}</slot>
          ${isRequired && !hasFieldContext
            ? html`<span class="required-mark" aria-hidden="true">${this.t('requiredIndicator')}</span>`
            : nothing}
        </legend>

        <div part="list" class="list" role="list">
          ${this.rows.map(
            (row, rowIdx) => html`
              <div part="row" class="row" role="listitem" data-index=${String(rowIdx)}>
                ${this.reorderable
                  ? html`
                      <button
                        type="button"
                        part="handle"
                        class="icon-btn"
                        aria-label=${this.t('dragHandle', { index: rowIdx + 1 })}
                        ?disabled=${isDisabled || isReadonly}
                      >
                        ⋮⋮
                      </button>
                    `
                  : nothing}

                <div class="fields">
                  ${schemas.map((schema) => {
                    const inputId = `mth-rep-${rowIdx}-${schema.name}`;
                    return html`
                      <div class="field">
                        <label for=${inputId} class="sub-label">${schema.label ?? schema.name}</label>
                        <input
                          id=${inputId}
                          part="control"
                          class="control"
                          type=${schema.type ?? 'text'}
                          placeholder=${schema.placeholder ?? ''}
                          .value=${row[schema.name] ?? ''}
                          ?disabled=${isDisabled}
                          ?readonly=${isReadonly}
                          @input=${(ev: Event) => this.handleCellInput(rowIdx, schema.name, ev)}
                          @change=${() => this.handleCellChange()}
                        />
                      </div>
                    `;
                  })}
                </div>

                <div class="row-controls">
                  ${this.reorderable
                    ? html`
                        <button
                          type="button"
                          part="move-up"
                          class="icon-btn"
                          aria-label=${this.t('moveUp', { index: rowIdx + 1 })}
                          ?disabled=${isDisabled || isReadonly || rowIdx === 0}
                          @click=${() => this.moveRow(rowIdx, rowIdx - 1)}
                        >
                          ↑
                        </button>
                        <button
                          type="button"
                          part="move-down"
                          class="icon-btn"
                          aria-label=${this.t('moveDown', { index: rowIdx + 1 })}
                          ?disabled=${isDisabled || isReadonly || rowIdx === this.rows.length - 1}
                          @click=${() => this.moveRow(rowIdx, rowIdx + 1)}
                        >
                          ↓
                        </button>
                      `
                    : nothing}
                  <button
                    type="button"
                    part="remove"
                    class="icon-btn"
                    aria-label=${this.t('removeRow', { index: rowIdx + 1 })}
                    ?disabled=${!canRemove}
                    @click=${() => this.removeRow(rowIdx)}
                  >
                    ✕
                  </button>
                </div>
              </div>
            `,
          )}
        </div>

        <button
          type="button"
          part="add"
          class="add-btn"
          ?disabled=${!canAdd}
          @click=${() => this.addRow()}
        >
          ${this.addLabel || this.t('addRow')}
        </button>

        <p
          id="mth-rep-hint"
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
          id="mth-rep-error"
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
      </fieldset>
    `;
  }
}
