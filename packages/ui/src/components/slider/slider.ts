import { UIElement, type PropertyValues } from '@methane/core';
import { FormControlController } from '@methane/primitives';
import { html, nothing } from 'lit';
import { property, query, state } from 'lit/decorators.js';
import { ifDefined } from 'lit/directives/if-defined.js';
import { sliderMessages } from './slider.messages.js';
import { sliderStyles } from './slider.styles.js';

export type SliderOrientation = 'horizontal' | 'vertical';
export type SliderSize = 'sm' | 'md' | 'lg';

/**
 * `<mth-slider>`: form-associated single-thumb range slider with ARIA slider
 * semantics, pointer dragging, RTL keyboard navigation, and dynamic CSS custom properties.
 */
export class MthSlider extends UIElement {
  static formAssociated = true;
  static override shadowRootOptions = { mode: 'open' as const, delegatesFocus: true };
  static override messages = sliderMessages;
  static override styles = sliderStyles;

  @property({ type: String, reflect: true })
  name = '';

  @property({ type: Number })
  value = 0;

  @property({ type: Number, attribute: 'default-value' })
  defaultValue = 0;

  @property({ type: Number })
  min = 0;

  @property({ type: Number })
  max = 100;

  @property({ type: Number })
  step = 1;

  @property({ type: String })
  label = '';

  @property({ type: String })
  hint = '';

  @property({ type: String })
  error = '';

  @property({ type: String, reflect: true })
  orientation: SliderOrientation = 'horizontal';

  @property({ type: String, reflect: true })
  size: SliderSize = 'md';

  @property({ type: Boolean, reflect: true, attribute: 'show-value' })
  showValue = false;

  @property({ type: Boolean, reflect: true })
  disabled = false;

  @property({ type: Boolean, reflect: true })
  readonly = false;

  @property({ attribute: false })
  formatValue: ((value: number) => string) | null = null;

  @state()
  private slottedLabelText = '';

  @state()
  private slottedHintText = '';

  @state()
  private slottedErrorText = '';

  @state()
  private dragging = false;

  @query('#mth-slider-track')
  private trackWrapEl!: HTMLElement | null;

  @query('#mth-slider-thumb')
  private thumbEl!: HTMLElement | null;

  private readonly formCtrl: FormControlController;
  private dynamicSheet: CSSStyleSheet | null = null;

  constructor() {
    super();

    this.formCtrl = new FormControlController(this, {
      internals: this.internals,
      defaultValue: String(this.defaultValue),
      messages: sliderMessages,
      onValueSync: (nextValue) => {
        const parsed = Number(nextValue);
        this.value = Number.isFinite(parsed) ? this.clampAndSnap(parsed) : this.clampAndSnap(this.defaultValue);
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

  override connectedCallback(): void {
    super.connectedCallback();
    this.ensureDynamicSheet();
    this.value = this.clampAndSnap(this.value);
    this.syncDynamicStyles();
  }

  override willUpdate(changed: PropertyValues<this>): void {
    super.willUpdate(changed);

    if (changed.has('defaultValue')) {
      this.formCtrl.setDefaultValue(String(this.defaultValue));
    }

    if (changed.has('value') || changed.has('min') || changed.has('max') || changed.has('step')) {
      const clamped = this.clampAndSnap(this.value);
      if (clamped !== this.value) {
        this.value = clamped;
      }
      this.formCtrl.setValue(String(clamped), { markDirty: false });
    }

    if (changed.has('disabled') || changed.has('readonly') || changed.has('error')) {
      this.formCtrl.hostDisabled = this.disabled;
      this.formCtrl.hostReadOnly = this.readonly;
      this.formCtrl.validate();
    }
  }

  override updated(changed: PropertyValues<this>): void {
    super.updated(changed);
    if (changed.has('value') || changed.has('min') || changed.has('max')) {
      this.syncDynamicStyles();
    }
  }

  override focus(options?: FocusOptions): void {
    this.thumbEl?.focus(options);
  }

  checkValidity(): boolean {
    return this.formCtrl.checkValidity();
  }

  reportValidity(): boolean {
    return this.formCtrl.reportValidity();
  }

  private ensureDynamicSheet(): void {
    if (this.dynamicSheet || !this.shadowRoot || typeof CSSStyleSheet === 'undefined') {
      return;
    }
    this.dynamicSheet = new CSSStyleSheet();
    this.shadowRoot.adoptedStyleSheets = [...this.shadowRoot.adoptedStyleSheets, this.dynamicSheet];
  }

  private syncDynamicStyles(): void {
    this.ensureDynamicSheet();
    if (!this.dynamicSheet) return;
    const pct = this.getPercent(this.value);
    this.dynamicSheet.replaceSync(`:host { --_slider-pct: ${pct}%; }`);
  }

  private getSafeStep(): number {
    return this.step > 0 && Number.isFinite(this.step) ? this.step : 1;
  }

  private getRange(): { min: number; max: number } {
    const min = Number.isFinite(this.min) ? this.min : 0;
    const max = Number.isFinite(this.max) && this.max >= min ? this.max : min + 100;
    return { min, max };
  }

  private clampAndSnap(raw: number): number {
    const { min, max } = this.getRange();
    const step = this.getSafeStep();
    const bounded = Math.min(max, Math.max(min, Number.isFinite(raw) ? raw : min));
    const stepsFromMin = Math.round((bounded - min) / step);
    const snapped = min + stepsFromMin * step;
    const precision = (step.toString().split('.')[1] ?? '').length;
    const rounded = Number(snapped.toFixed(Math.min(precision + 2, 10)));
    return Math.min(max, Math.max(min, rounded));
  }

  private getPercent(val: number): number {
    const { min, max } = this.getRange();
    if (max <= min) return 0;
    return Math.min(100, Math.max(0, ((val - min) / (max - min)) * 100));
  }

  private formatDisplayValue(val: number): string {
    return this.formatValue ? this.formatValue(val) : String(val);
  }

  private isRtl(): boolean {
    if (typeof getComputedStyle === 'function') {
      const dir = getComputedStyle(this).direction;
      if (dir === 'rtl') return true;
      if (dir === 'ltr') return false;
    }
    return this.getAttribute('dir') === 'rtl';
  }

  private updateFromPointer(clientX: number, clientY: number, commit: boolean): void {
    const track = this.trackWrapEl;
    if (!track) return;
    const rect = track.getBoundingClientRect();
    const { min, max } = this.getRange();
    let ratio: number;

    if (this.orientation === 'vertical') {
      const height = rect.height || 1;
      ratio = (rect.bottom - clientY) / height;
    } else {
      const width = rect.width || 1;
      ratio = this.isRtl() ? (rect.right - clientX) / width : (clientX - rect.left) / width;
    }

    const clampedRatio = Math.min(1, Math.max(0, ratio));
    const nextValue = this.clampAndSnap(min + clampedRatio * (max - min));
    this.applyUserValue(nextValue, commit);
  }

  private applyUserValue(nextValue: number, commit: boolean): void {
    const changed = nextValue !== this.value;
    if (changed) {
      this.value = nextValue;
      this.formCtrl.setValue(String(nextValue));
      this.formCtrl.markDirty();
      this.syncDynamicStyles();
      this.dispatchEvent(
        new CustomEvent('mth-input', {
          detail: { value: nextValue },
          bubbles: true,
          composed: true,
        }),
      );
    }

    if (commit) {
      this.dispatchEvent(
        new CustomEvent('mth-change', {
          detail: { value: this.value },
          bubbles: true,
          composed: true,
        }),
      );
    }
  }

  private handlePointerDown(event: PointerEvent): void {
    if (this.isEffectivelyDisabled || this.readonly || event.button !== 0) return;
    event.preventDefault();
    this.dragging = true;
    this.thumbEl?.focus();
    this.trackWrapEl?.setPointerCapture?.(event.pointerId);
    this.updateFromPointer(event.clientX, event.clientY, false);
  }

  private handlePointerMove(event: PointerEvent): void {
    if (!this.dragging || this.isEffectivelyDisabled || this.readonly) return;
    this.updateFromPointer(event.clientX, event.clientY, false);
  }

  private handlePointerUp(event: PointerEvent): void {
    if (!this.dragging) return;
    this.dragging = false;
    this.trackWrapEl?.releasePointerCapture?.(event.pointerId);
    this.updateFromPointer(event.clientX, event.clientY, true);
  }

  private handleKeyDown(event: KeyboardEvent): void {
    if (this.isEffectivelyDisabled || this.readonly) return;
    const step = this.getSafeStep();
    const { min, max } = this.getRange();
    const rtl = this.isRtl();
    let next: number;

    switch (event.key) {
      case 'ArrowRight':
        next = this.value + (rtl && this.orientation === 'horizontal' ? -step : step);
        break;
      case 'ArrowLeft':
        next = this.value + (rtl && this.orientation === 'horizontal' ? step : -step);
        break;
      case 'ArrowUp':
        next = this.value + step;
        break;
      case 'ArrowDown':
        next = this.value - step;
        break;
      case 'PageUp':
        next = this.value + step * 10;
        break;
      case 'PageDown':
        next = this.value - step * 10;
        break;
      case 'Home':
        next = min;
        break;
      case 'End':
        next = max;
        break;
      default:
        return;
    }

    event.preventDefault();
    this.applyUserValue(this.clampAndSnap(next), true);
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
    const { min, max } = this.getRange();
    const ctx = this.formCtrl.fieldContext;
    const effLabel = this.label || this.slottedLabelText || ctx?.label || '';
    const effHint = this.hint || this.slottedHintText || ctx?.hint || '';
    const rawError = this.error || this.slottedErrorText || ctx?.error || '';
    const hasLabel = Boolean(effLabel);
    const hasHint = Boolean(effHint);
    const hasError = Boolean(rawError);
    const describedByIds: Array<string> = [];
    if (hasHint) describedByIds.push('mth-slider-hint');
    if (hasError) describedByIds.push('mth-slider-error');
    const formatted = this.formatDisplayValue(this.value);

    return html`
      <div part="base" class="base">
        <div part="header" class="header" ?hidden=${!hasLabel && !this.showValue}>
          <span id="mth-slider-label" part="label" class="label" ?hidden=${!hasLabel}>
            <slot name="label" @slotchange=${this.handleLabelSlotChange}>${effLabel}</slot>
          </span>
          ${this.showValue
            ? html`<span part="value" class="value-readout">${formatted}</span>`
            : nothing}
        </div>

        <div
          id="mth-slider-track"
          part="track-wrap"
          class="track-wrap"
          @pointerdown=${this.handlePointerDown}
          @pointermove=${this.handlePointerMove}
          @pointerup=${this.handlePointerUp}
          @pointercancel=${this.handlePointerUp}
        >
          <div part="track" class="track">
            <div part="fill" class="fill"></div>
          </div>
          <div
            id="mth-slider-thumb"
            part="thumb"
            class="thumb"
            role="slider"
            tabindex=${this.isEffectivelyDisabled ? -1 : 0}
            aria-valuemin=${String(min)}
            aria-valuemax=${String(max)}
            aria-valuenow=${String(this.value)}
            aria-valuetext=${formatted}
            aria-orientation=${this.orientation}
            aria-disabled=${this.isEffectivelyDisabled ? 'true' : 'false'}
            aria-readonly=${this.readonly ? 'true' : 'false'}
            aria-labelledby=${ifDefined(hasLabel ? 'mth-slider-label' : undefined)}
            aria-label=${ifDefined(!hasLabel ? this.t('defaultLabel') : undefined)}
            aria-describedby=${ifDefined(describedByIds.length > 0 ? describedByIds.join(' ') : undefined)}
            @keydown=${this.handleKeyDown}
          ></div>
        </div>

        <div id="mth-slider-hint" part="hint" class="hint" ?hidden=${!hasHint}>
          <slot name="hint" @slotchange=${this.handleHintSlotChange}>${effHint}</slot>
        </div>

        <div
          id="mth-slider-error"
          part="error"
          class="error"
          role="alert"
          ?hidden=${!hasError}
        >
          <slot name="error" @slotchange=${this.handleErrorSlotChange}>${rawError}</slot>
        </div>
      </div>
    `;
  }
}
