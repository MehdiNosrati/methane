import { UIElement, type PropertyValues } from '@methane/core';
import { FormControlController } from '@methane/primitives';
import { html } from 'lit';
import { property } from 'lit/decorators.js';
import { live } from 'lit/directives/live.js';
import { quantitySelectorMessages } from './quantity-selector.messages.js';
import { quantitySelectorStyles } from './quantity-selector.styles.js';

/**
 * `<mth-quantity-selector>`: form-associated numeric stepper with min/max/step clamping,
 * accessible `spinbutton` keyboard support, and locale-safe numeric formatting.
 */
export class MthQuantitySelector extends UIElement {
  static formAssociated = true;
  static override shadowRootOptions = {
    ...UIElement.shadowRootOptions,
    delegatesFocus: true,
  };
  static override messages = quantitySelectorMessages;
  static override styles = quantitySelectorStyles;

  @property({ type: Number })
  value = 1;

  @property({ type: Number })
  min = 1;

  @property({ type: Number })
  max = 99;

  @property({ type: Number })
  step = 1;

  @property({ type: String, reflect: true })
  name = '';

  @property({ type: String })
  label = '';

  @property({ type: Boolean, reflect: true })
  disabled = false;

  @property({ type: Boolean, reflect: true })
  required = false;

  private initializedDefault = false;
  private readonly formCtrl: FormControlController;

  constructor() {
    super();
    this.formCtrl = new FormControlController(this, {
      internals: this.internals,
      defaultValue: '1',
      onValueSync: (val) => {
        const parsed = Number(val);
        if (Number.isFinite(parsed)) {
          this.value = this.clamp(parsed);
        }
      },
      onDisabledChange: () => {
        this.syncStates();
        this.requestUpdate();
      },
      onSetCustomState: (name, active) => {
        this.setCustomState(name, active);
      },
    });
  }

  override connectedCallback(): void {
    super.connectedCallback();
    if (!this.initializedDefault) {
      this.initializedDefault = true;
      const initial = String(this.clampedValue);
      this.formCtrl.setDefaultValue(initial);
      this.formCtrl.setValue(initial, { markDirty: false });
    }
  }

  override formDisabledCallback(disabled: boolean): void {
    super.formDisabledCallback(disabled);
    this.formCtrl.handleFormDisabled(disabled);
  }

  override formResetCallback(): void {
    super.formResetCallback();
    this.formCtrl.handleFormReset();
  }

  override formStateRestoreCallback(
    state: File | string | FormData | null,
    mode: 'restore' | 'autocomplete',
  ): void {
    super.formStateRestoreCallback(state, mode);
    this.formCtrl.handleFormStateRestore(state, mode);
  }

  get safeMin(): number {
    return Number.isFinite(this.min) ? this.min : 0;
  }

  get safeMax(): number {
    const min = this.safeMin;
    return Number.isFinite(this.max) ? Math.max(min, this.max) : Number.MAX_SAFE_INTEGER;
  }

  get safeStep(): number {
    return Number.isFinite(this.step) && this.step > 0 ? this.step : 1;
  }

  get clampedValue(): number {
    return this.clamp(this.value);
  }

  get effectivelyDisabled(): boolean {
    return this.formCtrl.disabled;
  }

  private get effectiveDisabled(): boolean {
    return this.formCtrl.disabled;
  }

  private clamp(raw: number): number {
    const base = Number.isFinite(raw) ? Math.round(raw) : this.safeMin;
    return Math.min(this.safeMax, Math.max(this.safeMin, base));
  }

  private commitValue(nextRaw: number, emitChange = true): void {
    if (this.effectiveDisabled) return;
    const next = this.clamp(nextRaw);
    const changed = next !== this.value;
    this.value = next;
    this.formCtrl.markTouched();
    this.formCtrl.setValue(String(next), { markDirty: true });
    this.syncStates();
    if (changed) {
      this.emitEvent('mth-input', { detail: { value: next } });
      if (emitChange) {
        this.emitEvent('mth-change', { detail: { value: next } });
      }
    }
  }

  private stepBy(delta: number): void {
    this.commitValue(this.clampedValue + delta, true);
  }

  private handleInputChange = (e: Event): void => {
    const target = e.target as HTMLInputElement;
    const parsed = Number(target.value.trim());
    if (!Number.isFinite(parsed)) {
      target.value = String(this.clampedValue);
      return;
    }
    this.commitValue(parsed, true);
  };

  private handleKeyDown = (e: KeyboardEvent): void => {
    if (this.effectiveDisabled) return;
    const step = this.safeStep;
    switch (e.key) {
      case 'ArrowUp':
        e.preventDefault();
        this.stepBy(step);
        break;
      case 'ArrowDown':
        e.preventDefault();
        this.stepBy(-step);
        break;
      case 'PageUp':
        e.preventDefault();
        this.stepBy(step * 10);
        break;
      case 'PageDown':
        e.preventDefault();
        this.stepBy(-step * 10);
        break;
      case 'Home':
        e.preventDefault();
        this.commitValue(this.safeMin, true);
        break;
      case 'End':
        e.preventDefault();
        this.commitValue(this.safeMax, true);
        break;
    }
  };

  private syncStates(): void {
    const current = this.clampedValue;
    this.setCustomState('disabled', this.effectiveDisabled);
    this.setCustomState('min', current <= this.safeMin);
    this.setCustomState('max', current >= this.safeMax);
  }

  protected override willUpdate(changed: PropertyValues<this>): void {
    super.willUpdate(changed);
    if (
      changed.has('value') ||
      changed.has('min') ||
      changed.has('max') ||
      changed.has('disabled') ||
      changed.has('required')
    ) {
      this.formCtrl.hostDisabled = this.disabled;
      this.formCtrl.required = this.required;
      this.formCtrl.setValue(String(this.clampedValue), { markDirty: false });
      this.syncStates();
    }
  }

  protected override render() {
    const current = this.clampedValue;
    const isDisabled = this.effectiveDisabled;
    const atMin = current <= this.safeMin;
    const atMax = current >= this.safeMax;

    return html`
      <div
        class="root"
        part="base"
        role="group"
        dir=${this.resolvedDir}
        aria-label=${this.label || this.t('groupLabel')}
      >
        <button
          type="button"
          class="step-btn"
          part="decrement"
          aria-label=${this.t('decrementLabel')}
          ?disabled=${isDisabled || atMin}
          @click=${() => this.stepBy(-this.safeStep)}
        >
          -
        </button>
        <input
          class="input"
          part="input"
          type="text"
          inputmode="numeric"
          role="spinbutton"
          aria-label=${this.label || this.t('inputLabel')}
          aria-valuemin=${String(this.safeMin)}
          aria-valuemax=${String(this.safeMax)}
          aria-valuenow=${String(current)}
          .value=${live(String(current))}
          ?disabled=${isDisabled}
          ?required=${this.required}
          @change=${this.handleInputChange}
          @keydown=${this.handleKeyDown}
        />
        <button
          type="button"
          class="step-btn"
          part="increment"
          aria-label=${this.t('incrementLabel')}
          ?disabled=${isDisabled || atMax}
          @click=${() => this.stepBy(this.safeStep)}
        >
          +
        </button>
      </div>
    `;
  }
}
