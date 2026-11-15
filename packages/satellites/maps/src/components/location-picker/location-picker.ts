import { html, nothing, property, query, UIElement, type PropertyValues, type TemplateResult } from '@methane-ui/core';
import { FormControlController, ObserverPoolController } from '@methane-ui/primitives';
import { createMapEngine, normalizeLngLat, type MapEngineHandle } from '../shared/map-engine.js';
import { locationPickerMessages } from './location-picker.messages.js';
import { locationPickerStyles } from './location-picker.styles.js';

export function parseLocationValue(raw: string): { lat: number; lng: number } | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const parts = trimmed.split(',');
  if (parts.length !== 2) return null;
  const lat = Number(parts[0]);
  const lng = Number(parts[1]);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return null;
  return { lat, lng };
}

export class MthLocationPicker extends UIElement {
  static formAssociated = true;
  static override shadowRootOptions = {
    ...UIElement.shadowRootOptions,
    delegatesFocus: true,
  };
  static override styles = locationPickerStyles;
  static override messages = locationPickerMessages;

  @property({ type: String }) name = '';
  @property({ type: String }) value = '';
  @property({ type: String, attribute: 'default-value' }) defaultValue = '';
  @property({ type: String }) label = '';
  @property({ type: Number }) step = 0.01;
  @property({ type: Boolean, reflect: true }) required = false;
  @property({ type: Boolean, reflect: true }) disabled = false;
  @property({ type: Boolean, reflect: true, attribute: 'readonly' }) readOnly = false;

  @query('.canvas') private canvasEl?: HTMLElement | null;

  private _engine: MapEngineHandle | null = null;
  private readonly observerCtrl = new ObserverPoolController(this);
  private observedCanvasEl: HTMLElement | null = null;
  private readonly formCtrl: FormControlController;

  constructor() {
    super();
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
        if (val && !parseLocationValue(val)) {
          return { flags: { patternMismatch: true }, message: this.t('invalidFormatError') };
        }
        return null;
      },
      onValueSync: (nextVal) => {
        this.value = nextVal;
        this.syncEngineToValue();
      },
      onSetCustomState: (name, active) => {
        this.setCustomState(name, active);
      },
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

  private get isRtl(): boolean {
    return (this.closest('[dir]')?.getAttribute('dir')?.toLowerCase() ?? this.resolvedDir) === 'rtl';
  }

  private syncEngineCanvas(): void {
    if (this._engine && this.canvasEl) {
      this._engine.attachContainer(this.canvasEl);
      this._engine.syncThemeTokens();
      if (this.observedCanvasEl !== this.canvasEl) {
        this.observedCanvasEl = this.canvasEl;
        this.observerCtrl.observeResize(this.canvasEl, () => {
          this._engine?.resize();
        });
      }
    }
  }

  override connectedCallback(): void {
    super.connectedCallback();
    if (!this._engine) {
      const parsed = parseLocationValue(this.value);
      this._engine = createMapEngine({
        host: this,
        center: parsed ? [parsed.lng, parsed.lat] : [-122.4194, 37.7749],
        zoom: 12,
      });
    }
    this.formCtrl.setDefaultValue(this.defaultValue);
    this.formCtrl.setValue(this.value);
    if (this.hasUpdated) {
      this.syncEngineCanvas();
    }
  }

  override disconnectedCallback(): void {
    this.observedCanvasEl = null;
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
    if (changed.has('value')) {
      this.formCtrl.setValue(this.value);
      this.syncEngineToValue();
    }
  }

  protected override updated(changed: PropertyValues): void {
    super.updated(changed);
    this.syncEngineCanvas();
  }

  checkValidity(): boolean {
    return this.formCtrl.checkValidity();
  }

  reportValidity(): boolean {
    return this.formCtrl.reportValidity();
  }

  setCoordinates(lat: number, lng: number, emit = true): void {
    if (this.formCtrl.disabled || this.formCtrl.readOnly) return;
    const [normLng, normLat] = normalizeLngLat(lng, lat);
    const formatted = `${normLat.toFixed(6)},${normLng.toFixed(6)}`;
    this.value = formatted;
    this.formCtrl.setValue(formatted, { markDirty: true });
    this._engine?.setView({ center: [normLng, normLat] });
    if (emit) {
      this.emitEvent('input');
      this.emitEvent('change');
      this.emitEvent('mth-location-select', {
        detail: { lat: normLat, lng: normLng, value: formatted },
      });
    }
  }

  clearLocation(): void {
    if (this.formCtrl.disabled || this.formCtrl.readOnly) return;
    this.value = '';
    this.formCtrl.setValue('', { markDirty: true });
    this.emitEvent('input');
    this.emitEvent('change');
  }

  private syncEngineToValue(): void {
    const parsed = parseLocationValue(this.value);
    if (parsed && this._engine) {
      this._engine.setView({ center: [parsed.lng, parsed.lat] });
    }
  }

  private nudge(dLat: number, dLng: number): void {
    const current = parseLocationValue(this.value) ?? {
      lat: this._engine?.center[1] ?? 37.7749,
      lng: this._engine?.center[0] ?? -122.4194,
    };
    this.setCoordinates(current.lat + dLat, current.lng + dLng, true);
  }

  private handlePinKeydown(event: KeyboardEvent): void {
    if (this.formCtrl.disabled || this.formCtrl.readOnly) return;
    const delta = Number.isFinite(this.step) && this.step > 0 ? this.step : 0.01;
    const dirSign = this.isRtl ? -1 : 1;
    switch (event.key) {
      case 'ArrowLeft':
        event.preventDefault();
        this.nudge(0, -delta * dirSign);
        break;
      case 'ArrowRight':
        event.preventDefault();
        this.nudge(0, delta * dirSign);
        break;
      case 'ArrowUp':
        event.preventDefault();
        this.nudge(delta, 0);
        break;
      case 'ArrowDown':
        event.preventDefault();
        this.nudge(-delta, 0);
        break;
      case 'Delete':
      case 'Backspace':
        event.preventDefault();
        this.clearLocation();
        break;
      default:
        break;
    }
  }

  protected override render(): TemplateResult {
    const isDisabled = this.formCtrl.disabled;
    const parsed = parseLocationValue(this.value);
    const labelText = this.label || this.t('defaultLabel');
    const readoutText = parsed
      ? this.t('coordinateSummary', { lat: parsed.lat.toFixed(4), lng: parsed.lng.toFixed(4) })
      : this.t('noLocationSelected');
    const errorMsg = this.formCtrl.invalid ? this.validationMessage : '';

    return html`
      <div class="base" part="base">
        <span id="mth-loc-label" class="label" part="label">${labelText}</span>
        <div class="viewport">
          <div class="canvas" part="canvas" aria-hidden="true"></div>
          <slot name="fallback"></slot>
          <button
            type="button"
            class="pin-target"
            part="pin-target"
            aria-labelledby="mth-loc-label"
            aria-describedby="mth-loc-readout"
            aria-errormessage=${errorMsg ? 'mth-loc-error' : nothing}
            aria-invalid=${this.formCtrl.invalid ? 'true' : 'false'}
            ?disabled=${isDisabled}
            @keydown=${this.handlePinKeydown}
            @click=${() => {
              const c = this._engine?.center ?? [-122.4194, 37.7749];
              this.setCoordinates(c[1], c[0], true);
            }}
          >
            ${readoutText}
          </button>
        </div>
        <div class="controls">
          <div class="nudge-group" role="group" aria-label=${this.t('pinInstructions')}>
            <button
              type="button"
              class="action-btn"
              aria-label=${this.t('nudgeWest')}
              ?disabled=${isDisabled || this.readOnly}
              @click=${() => this.nudge(0, -(this.step || 0.01))}
            >
              W
            </button>
            <button
              type="button"
              class="action-btn"
              aria-label=${this.t('nudgeNorth')}
              ?disabled=${isDisabled || this.readOnly}
              @click=${() => this.nudge(this.step || 0.01, 0)}
            >
              N
            </button>
            <button
              type="button"
              class="action-btn"
              aria-label=${this.t('nudgeSouth')}
              ?disabled=${isDisabled || this.readOnly}
              @click=${() => this.nudge(-(this.step || 0.01), 0)}
            >
              S
            </button>
            <button
              type="button"
              class="action-btn"
              aria-label=${this.t('nudgeEast')}
              ?disabled=${isDisabled || this.readOnly}
              @click=${() => this.nudge(0, this.step || 0.01)}
            >
              E
            </button>
          </div>
          <span id="mth-loc-readout" class="readout" part="readout">${readoutText}</span>
          <button
            type="button"
            class="action-btn"
            part="clear-button"
            ?disabled=${isDisabled || this.readOnly || !this.value}
            @click=${() => this.clearLocation()}
          >
            ${this.t('clearLabel')}
          </button>
        </div>
        ${errorMsg
          ? html`<div id="mth-loc-error" class="error" part="error" role="alert">${errorMsg}</div>`
          : nothing}
      </div>
    `;
  }
}
