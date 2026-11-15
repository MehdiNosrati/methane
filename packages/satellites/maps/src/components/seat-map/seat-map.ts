import { html, nothing, property, UIElement, type PropertyValues, type TemplateResult } from '@methane/core';
import { FormControlController, RovingFocusController, SelectionController } from '@methane/primitives';
import { createMapEngine, type MapEngineHandle } from '../shared/map-engine.js';
import { seatMapMessages } from './seat-map.messages.js';
import { seatMapStyles } from './seat-map.styles.js';

export type SeatStatus = 'available' | 'occupied' | 'disabled';

export interface SeatDefinition {
  readonly id: string;
  readonly label?: string;
  readonly row?: string;
  readonly tier?: string;
  readonly status?: SeatStatus;
}

function parseSeatCsv(raw: string): string[] {
  return raw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

export class MthSeatMap extends UIElement {
  static formAssociated = true;
  static override shadowRootOptions = {
    ...UIElement.shadowRootOptions,
    delegatesFocus: true,
  };
  static override styles = seatMapStyles;
  static override messages = seatMapMessages;

  @property({ type: String }) name = '';
  @property({ type: String }) value = '';
  @property({ type: String, attribute: 'default-value' }) defaultValue = '';
  @property({ attribute: false }) seats: ReadonlyArray<SeatDefinition> = [];
  @property({ type: Number }) columns = 4;
  @property({ type: Boolean, reflect: true }) multiple = true;
  @property({ type: Boolean, reflect: true }) required = false;
  @property({ type: Boolean, reflect: true }) disabled = false;
  @property({ type: Boolean, reflect: true, attribute: 'readonly' }) readOnly = false;
  @property({ type: String }) label = '';

  private _engine: MapEngineHandle | null = null;
  private readonly formCtrl: FormControlController;
  private readonly selectionCtrl: SelectionController<string>;
  private readonly rovingCtrl: RovingFocusController;

  constructor() {
    super();
    this.selectionCtrl = new SelectionController<string>(this, {
      mode: this.multiple ? 'multiple' : 'single',
      allowEmpty: true,
      onChange: (selected) => {
        const serialized = selected.join(',');
        this.value = serialized;
        this.formCtrl.setValue(serialized, { markDirty: true });
      },
    });
    this.formCtrl = new FormControlController(this, {
      internals: this.internals,
      defaultValue: this.defaultValue,
      required: this.required,
      disabled: this.disabled,
      readOnly: this.readOnly,
      validator: (ctx) => {
        const val = typeof ctx.value === 'string' ? ctx.value.trim() : '';
        if (ctx.required && !val) {
          return { flags: { valueMissing: true }, message: this.t('requiredError') };
        }
        return null;
      },
      onValueSync: (nextVal) => {
        this.value = nextVal;
        this.selectionCtrl.setSelection(parseSeatCsv(nextVal));
      },
      onSetCustomState: (name, active) => {
        this.setCustomState(name, active);
      },
    });
    this.rovingCtrl = new RovingFocusController(this, {
      orientation: 'both',
      columns: Math.max(1, this.columns),
      loop: false,
      getItems: () => Array.from(this.shadowRoot?.querySelectorAll<HTMLElement>('.seat-btn') ?? []),
    });
  }

  get engine(): MapEngineHandle | null {
    return this._engine;
  }

  get validity(): ValidityState | undefined {
    return this.internals?.validity;
  }

  get validationMessage(): string {
    return this.formCtrl.validationMessage || this.internals?.validationMessage || '';
  }

  get isDisabled(): boolean {
    return this.formCtrl.disabled;
  }

  get selectedSeats(): ReadonlyArray<string> {
    return this.selectionCtrl.selectedValues;
  }

  private get isRtl(): boolean {
    return (this.closest('[dir]')?.getAttribute('dir')?.toLowerCase() ?? this.resolvedDir) === 'rtl';
  }

  private get safeColumns(): number {
    return Number.isFinite(this.columns) && this.columns >= 1 ? Math.floor(this.columns) : 4;
  }

  override connectedCallback(): void {
    super.connectedCallback();
    if (!this._engine) {
      this._engine = createMapEngine({ host: this });
    }
    this.setCustomState('multiple', this.multiple);
    this.syncSelectionItems();
    this.formCtrl.setDefaultValue(this.defaultValue);
    this.formCtrl.setValue(this.value);
    this.selectionCtrl.setSelection(parseSeatCsv(this.value));
  }

  override disconnectedCallback(): void {
    if (this._engine) {
      this._engine.remove();
      this._engine = null;
    }
    super.disconnectedCallback();
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

  protected override willUpdate(changed: PropertyValues): void {
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
    if (changed.has('readOnly')) {
      this.formCtrl.hostReadOnly = this.readOnly;
    }
    if (changed.has('multiple')) {
      this.selectionCtrl.mode = this.multiple ? 'multiple' : 'single';
      this.setCustomState('multiple', this.multiple);
    }
    if (changed.has('seats')) {
      this.syncSelectionItems();
    }
    if (changed.has('value')) {
      this.formCtrl.setValue(this.value);
      this.selectionCtrl.setSelection(parseSeatCsv(this.value));
    }
    this.rovingCtrl.updateOptions({
      orientation: this.safeColumns > 1 ? 'both' : 'vertical',
      columns: this.safeColumns,
      dir: this.isRtl ? 'rtl' : 'ltr',
    });
  }

  protected override updated(changed: PropertyValues): void {
    super.updated(changed);
    this._engine?.syncThemeTokens();
  }

  checkValidity(): boolean {
    return this.formCtrl.checkValidity();
  }

  reportValidity(): boolean {
    return this.formCtrl.reportValidity();
  }

  toggleSeat(seat: SeatDefinition): void {
    if (
      this.formCtrl.disabled ||
      this.formCtrl.readOnly ||
      seat.status === 'occupied' ||
      seat.status === 'disabled'
    ) {
      return;
    }
    if (this.multiple) {
      this.selectionCtrl.toggle(seat.id);
    } else {
      this.selectionCtrl.select(seat.id);
    }
    this.emitEvent('input');
    this.emitEvent('change');
    this.emitEvent('mth-seat-select', {
      detail: {
        selectedIds: this.selectionCtrl.selectedValues,
        seat,
      },
    });
  }

  private syncSelectionItems(): void {
    this.selectionCtrl.setItems(
      this.seats.map((s) => ({
        value: s.id,
        disabled: s.status === 'occupied' || s.status === 'disabled',
      })),
    );
  }

  private get seatRows(): ReadonlyArray<ReadonlyArray<SeatDefinition>> {
    const cols = this.safeColumns;
    const rows: SeatDefinition[][] = [];
    for (let i = 0; i < this.seats.length; i += cols) {
      rows.push(this.seats.slice(i, i + cols));
    }
    return rows;
  }

  protected override render(): TemplateResult {
    const hostDisabled = this.formCtrl.disabled;
    const labelText = this.label || this.t('defaultLabel');
    const selectedSet = this.selectionCtrl.selectedSet;
    const rows = this.seatRows;
    const errorMsg = this.formCtrl.invalid ? this.validationMessage : '';

    return html`
      <div class="base" part="base">
        <div class="header">
          <span id="mth-seat-label" class="label" part="label">${labelText}</span>
          <span class="summary">${this.t('selectedCount', { count: selectedSet.size })}</span>
        </div>

        <slot name="fallback"></slot>
        <div class="stage" part="stage">${this.t('stageLabel')}</div>

        <div
          class="grid"
          part="grid"
          role="grid"
          aria-labelledby="mth-seat-label"
          aria-invalid=${this.formCtrl.invalid ? 'true' : 'false'}
          aria-errormessage=${errorMsg ? 'mth-seat-error' : nothing}
          aria-multiselectable=${this.multiple ? 'true' : 'false'}
        >
          ${rows.map(
            (row, rowIdx) => html`
              <div class="row" role="row">
                ${row.map((seat, colIdx) => {
                  const isUnavailable =
                    hostDisabled || seat.status === 'occupied' || seat.status === 'disabled';
                  const isSelected = selectedSet.has(seat.id);
                  const displayLabel = seat.label ?? seat.id;
                  const tierLabel = seat.tier ?? this.t('defaultTier');
                  const ariaLabel =
                    seat.status === 'occupied'
                      ? this.t('seatOccupiedLabel', { label: displayLabel, tier: tierLabel })
                      : seat.status === 'disabled' || hostDisabled
                        ? this.t('seatDisabledLabel', { label: displayLabel })
                        : isSelected
                          ? this.t('seatSelectedLabel', { label: displayLabel, tier: tierLabel })
                          : this.t('seatAvailableLabel', { label: displayLabel, tier: tierLabel });
                  const isFirst = rowIdx === 0 && colIdx === 0;
                  return html`
                    <button
                      type="button"
                      class="seat-btn"
                      part="seat"
                      role="gridcell"
                      data-tier=${seat.tier ?? 'standard'}
                      tabindex=${isFirst ? '0' : '-1'}
                      aria-selected=${isSelected ? 'true' : 'false'}
                      aria-disabled=${isUnavailable ? 'true' : 'false'}
                      aria-label=${ariaLabel}
                      @click=${() => this.toggleSeat(seat)}
                    >
                      ${displayLabel}
                    </button>
                  `;
                })}
              </div>
            `,
          )}
        </div>

        <div class="legend" part="legend">
          <span>${this.t('legendAvailable')}</span>
          <span>${this.t('legendSelected')}</span>
          <span>${this.t('legendOccupied')}</span>
        </div>

        ${errorMsg
          ? html`<div id="mth-seat-error" class="error" part="error" role="alert">${errorMsg}</div>`
          : nothing}
      </div>
    `;
  }
}
