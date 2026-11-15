import { UIElement, type PropertyValues } from '@methane/core';
import { FormControlController } from '@methane/primitives';
import { html, nothing } from 'lit';
import { property, query, state } from 'lit/decorators.js';
import { ifDefined } from 'lit/directives/if-defined.js';
import { rangeSliderMessages } from './range-slider.messages.js';
import { rangeSliderStyles } from './range-slider.styles.js';

export type RangeSliderSize = 'sm' | 'md' | 'lg';
type ActiveThumb = 'start' | 'end';

/**
 * `<mth-range-slider>`: form-associated dual-thumb range slider with independent
 * start/end thumbs, min-distance enforcement, RTL support, and adoptedStyleSheets.
 */
export class MthRangeSlider extends UIElement {
  static formAssociated = true;
  static override shadowRootOptions = { mode: 'open' as const, delegatesFocus: true };
  static override messages = rangeSliderMessages;
  static override styles = rangeSliderStyles;

  @property({ type: String, reflect: true })
  name = '';

  @property({ type: String })
  value = '25,75';

  @property({ type: String, attribute: 'default-value' })
  defaultValue = '25,75';

  @property({ type: Number })
  start = 25;

  @property({ type: Number })
  end = 75;

  @property({ type: Number })
  min = 0;

  @property({ type: Number })
  max = 100;

  @property({ type: Number })
  step = 1;

  @property({ type: Number, attribute: 'min-distance' })
  minDistance = 0;

  @property({ type: String })
  label = '';

  @property({ type: String })
  hint = '';

  @property({ type: String })
  error = '';

  @property({ type: String, reflect: true })
  size: RangeSliderSize = 'md';

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
  private activeThumb: ActiveThumb | null = null;

  @query('#mth-rs-track')
  private trackWrapEl!: HTMLElement | null;

  @query('#mth-rs-thumb-start')
  private startThumbEl!: HTMLElement | null;

  @query('#mth-rs-thumb-end')
  private endThumbEl!: HTMLElement | null;

  private readonly formCtrl: FormControlController;
  private dynamicSheet: CSSStyleSheet | null = null;
  private syncingFromPair = false;

  constructor() {
    super();

    this.formCtrl = new FormControlController(this, {
      internals: this.internals,
      defaultValue: this.defaultValue,
      messages: rangeSliderMessages,
      onValueSync: (nextVal) => {
        this.applyStringValue(nextVal);
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
    this.normalizePair(this.start, this.end);
    this.syncDynamicStyles();
  }

  override willUpdate(changed: PropertyValues<this>): void {
    super.willUpdate(changed);

    if (changed.has('defaultValue')) {
      this.formCtrl.setDefaultValue(this.defaultValue);
    }

    if (changed.has('value') && !this.syncingFromPair) {
      this.applyStringValue(this.value);
    } else if (
      changed.has('start') ||
      changed.has('end') ||
      changed.has('min') ||
      changed.has('max') ||
      changed.has('step') ||
      changed.has('minDistance')
    ) {
      this.normalizePair(this.start, this.end);
    }

    if (changed.has('disabled') || changed.has('readonly') || changed.has('error')) {
      this.formCtrl.hostDisabled = this.disabled;
      this.formCtrl.hostReadOnly = this.readonly;
      this.formCtrl.validate();
    }
  }

  override updated(changed: PropertyValues<this>): void {
    super.updated(changed);
    if (changed.has('start') || changed.has('end') || changed.has('min') || changed.has('max')) {
      this.syncDynamicStyles();
    }
  }

  override focus(options?: FocusOptions): void {
    this.startThumbEl?.focus(options);
  }

  checkValidity(): boolean {
    return this.formCtrl.checkValidity();
  }

  reportValidity(): boolean {
    return this.formCtrl.reportValidity();
  }

  private ensureDynamicSheet(): void {
    if (this.dynamicSheet || !this.shadowRoot || typeof CSSStyleSheet === 'undefined') return;
    this.dynamicSheet = new CSSStyleSheet();
    this.shadowRoot.adoptedStyleSheets = [...this.shadowRoot.adoptedStyleSheets, this.dynamicSheet];
  }

  private syncDynamicStyles(): void {
    this.ensureDynamicSheet();
    if (!this.dynamicSheet) return;
    const startPct = this.getPercent(this.start);
    const endPct = this.getPercent(this.end);
    this.dynamicSheet.replaceSync(
      `:host { --_range-start-pct: ${startPct}%; --_range-end-pct: ${endPct}%; }`,
    );
  }

  private getRange(): { min: number; max: number } {
    const min = Number.isFinite(this.min) ? this.min : 0;
    const max = Number.isFinite(this.max) && this.max >= min ? this.max : min + 100;
    return { min, max };
  }

  private getSafeStep(): number {
    return this.step > 0 && Number.isFinite(this.step) ? this.step : 1;
  }

  private getSafeMinDistance(): number {
    return this.minDistance > 0 && Number.isFinite(this.minDistance) ? this.minDistance : 0;
  }

  private snap(raw: number): number {
    const { min, max } = this.getRange();
    const step = this.getSafeStep();
    const bounded = Math.min(max, Math.max(min, Number.isFinite(raw) ? raw : min));
    const stepsFromMin = Math.round((bounded - min) / step);
    const snapped = min + stepsFromMin * step;
    const precision = (step.toString().split('.')[1] ?? '').length;
    const rounded = Number(snapped.toFixed(Math.min(precision + 2, 10)));
    return Math.min(max, Math.max(min, rounded));
  }

  private normalizePair(rawStart: number, rawEnd: number): { start: number; end: number } {
    const { min, max } = this.getRange();
    const gap = Math.min(max - min, this.getSafeMinDistance());
    let nextStart = this.snap(rawStart);
    let nextEnd = this.snap(rawEnd);

    if (nextStart > nextEnd - gap) {
      nextEnd = this.snap(Math.min(max, nextStart + gap));
      if (nextStart > nextEnd - gap) {
        nextStart = this.snap(Math.max(min, nextEnd - gap));
      }
    }

    this.syncingFromPair = true;
    this.start = nextStart;
    this.end = nextEnd;
    const serialized = `${nextStart},${nextEnd}`;
    this.value = serialized;
    this.formCtrl.setValue(serialized, { markDirty: false });
    this.syncingFromPair = false;
    return { start: nextStart, end: nextEnd };
  }

  private applyStringValue(raw: string): void {
    const parts = raw.split(',').map((s) => Number(s.trim()));
    if (parts.length >= 2 && Number.isFinite(parts[0]) && Number.isFinite(parts[1])) {
      this.normalizePair(parts[0]!, parts[1]!);
    } else {
      const { min, max } = this.getRange();
      this.normalizePair(min, max);
    }
  }

  private getPercent(val: number): number {
    const { min, max } = this.getRange();
    if (max <= min) return 0;
    return Math.min(100, Math.max(0, ((val - min) / (max - min)) * 100));
  }

  private isRtl(): boolean {
    if (typeof getComputedStyle === 'function') {
      const dir = getComputedStyle(this).direction;
      if (dir === 'rtl') return true;
      if (dir === 'ltr') return false;
    }
    return this.getAttribute('dir') === 'rtl';
  }

  private pointerToValue(clientX: number): number {
    const track = this.trackWrapEl;
    if (!track) return this.start;
    const rect = track.getBoundingClientRect();
    const width = rect.width || 1;
    const ratio = this.isRtl() ? (rect.right - clientX) / width : (clientX - rect.left) / width;
    const clampedRatio = Math.min(1, Math.max(0, ratio));
    const { min, max } = this.getRange();
    return this.snap(min + clampedRatio * (max - min));
  }

  private updateThumb(thumb: ActiveThumb, targetVal: number, commit: boolean): void {
    const gap = this.getSafeMinDistance();
    const prevStart = this.start;
    const prevEnd = this.end;
    let nextStart = this.start;
    let nextEnd = this.end;

    if (thumb === 'start') {
      nextStart = Math.min(targetVal, this.end - gap);
    } else {
      nextEnd = Math.max(targetVal, this.start + gap);
    }

    const pair = this.normalizePair(nextStart, nextEnd);
    const changed = pair.start !== prevStart || pair.end !== prevEnd;

    if (changed) {
      this.formCtrl.markDirty();
      this.syncDynamicStyles();
      this.dispatchEvent(
        new CustomEvent('mth-input', {
          detail: { start: pair.start, end: pair.end, value: this.value },
          bubbles: true,
          composed: true,
        }),
      );
    }

    if (commit) {
      this.dispatchEvent(
        new CustomEvent('mth-change', {
          detail: { start: pair.start, end: pair.end, value: this.value },
          bubbles: true,
          composed: true,
        }),
      );
    }
  }

  private handlePointerDown(event: PointerEvent): void {
    if (this.isEffectivelyDisabled || this.readonly || event.button !== 0) return;
    event.preventDefault();
    const clickedVal = this.pointerToValue(event.clientX);
    const distStart = Math.abs(clickedVal - this.start);
    const distEnd = Math.abs(clickedVal - this.end);
    const chosen: ActiveThumb = distStart < distEnd || (distStart === distEnd && clickedVal <= this.start) ? 'start' : 'end';
    this.activeThumb = chosen;
    (chosen === 'start' ? this.startThumbEl : this.endThumbEl)?.focus();
    this.trackWrapEl?.setPointerCapture?.(event.pointerId);
    this.updateThumb(chosen, clickedVal, false);
  }

  private handlePointerMove(event: PointerEvent): void {
    if (!this.activeThumb || this.isEffectivelyDisabled || this.readonly) return;
    this.updateThumb(this.activeThumb, this.pointerToValue(event.clientX), false);
  }

  private handlePointerUp(event: PointerEvent): void {
    if (!this.activeThumb) return;
    const thumb = this.activeThumb;
    this.activeThumb = null;
    this.trackWrapEl?.releasePointerCapture?.(event.pointerId);
    this.updateThumb(thumb, this.pointerToValue(event.clientX), true);
  }

  private handleThumbKeyDown(thumb: ActiveThumb, event: KeyboardEvent): void {
    if (this.isEffectivelyDisabled || this.readonly) return;
    const step = this.getSafeStep();
    const { min, max } = this.getRange();
    const gap = this.getSafeMinDistance();
    const rtl = this.isRtl();
    const current = thumb === 'start' ? this.start : this.end;
    const lowerBound = thumb === 'start' ? min : this.start + gap;
    const upperBound = thumb === 'start' ? this.end - gap : max;
    let next: number;

    switch (event.key) {
      case 'ArrowRight':
        next = current + (rtl ? -step : step);
        break;
      case 'ArrowLeft':
        next = current + (rtl ? step : -step);
        break;
      case 'ArrowUp':
        next = current + step;
        break;
      case 'ArrowDown':
        next = current - step;
        break;
      case 'PageUp':
        next = current + step * 10;
        break;
      case 'PageDown':
        next = current - step * 10;
        break;
      case 'Home':
        next = lowerBound;
        break;
      case 'End':
        next = upperBound;
        break;
      default:
        return;
    }

    event.preventDefault();
    this.updateThumb(thumb, Math.min(upperBound, Math.max(lowerBound, next)), true);
  }

  private formatNumber(val: number): string {
    return this.formatValue ? this.formatValue(val) : String(val);
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
    const gap = this.getSafeMinDistance();
    const ctx = this.formCtrl.fieldContext;
    const effLabel = this.label || this.slottedLabelText || ctx?.label || '';
    const effHint = this.hint || this.slottedHintText || ctx?.hint || '';
    const rawError = this.error || this.slottedErrorText || ctx?.error || '';
    const hasLabel = Boolean(effLabel);
    const hasHint = Boolean(effHint);
    const hasError = Boolean(rawError);
    const describedByIds: Array<string> = [];
    if (hasHint) describedByIds.push('mth-rs-hint');
    if (hasError) describedByIds.push('mth-rs-error');
    const describedBy = describedByIds.length > 0 ? describedByIds.join(' ') : undefined;
    const startText = this.formatNumber(this.start);
    const endText = this.formatNumber(this.end);
    const groupPrefix = effLabel;

    return html`
      <div part="base" class="base">
        <div part="header" class="header" ?hidden=${!hasLabel && !this.showValue}>
          <span id="mth-rs-label" part="label" class="label" ?hidden=${!hasLabel}>
            <slot name="label" @slotchange=${this.handleLabelSlotChange}>${effLabel}</slot>
          </span>
          ${this.showValue
            ? html`<span part="value" class="value-readout">${startText} – ${endText}</span>`
            : nothing}
        </div>

        <div
          id="mth-rs-track"
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
            id="mth-rs-thumb-start"
            part="thumb-start"
            class="thumb thumb-start"
            role="slider"
            tabindex=${this.isEffectivelyDisabled ? -1 : 0}
            aria-label=${groupPrefix
              ? `${groupPrefix} ${this.t('startThumbLabel')}`
              : this.t('startThumbLabel')}
            aria-valuemin=${String(min)}
            aria-valuemax=${String(this.end - gap)}
            aria-valuenow=${String(this.start)}
            aria-valuetext=${startText}
            aria-disabled=${this.isEffectivelyDisabled ? 'true' : 'false'}
            aria-readonly=${this.readonly ? 'true' : 'false'}
            aria-describedby=${ifDefined(describedBy)}
            @keydown=${(e: KeyboardEvent) => this.handleThumbKeyDown('start', e)}
          ></div>

          <div
            id="mth-rs-thumb-end"
            part="thumb-end"
            class="thumb thumb-end"
            role="slider"
            tabindex=${this.isEffectivelyDisabled ? -1 : 0}
            aria-label=${groupPrefix
              ? `${groupPrefix} ${this.t('endThumbLabel')}`
              : this.t('endThumbLabel')}
            aria-valuemin=${String(this.start + gap)}
            aria-valuemax=${String(max)}
            aria-valuenow=${String(this.end)}
            aria-valuetext=${endText}
            aria-disabled=${this.isEffectivelyDisabled ? 'true' : 'false'}
            aria-readonly=${this.readonly ? 'true' : 'false'}
            aria-describedby=${ifDefined(describedBy)}
            @keydown=${(e: KeyboardEvent) => this.handleThumbKeyDown('end', e)}
          ></div>
        </div>

        <div id="mth-rs-hint" part="hint" class="hint" ?hidden=${!hasHint}>
          <slot name="hint" @slotchange=${this.handleHintSlotChange}>${effHint}</slot>
        </div>

        <div id="mth-rs-error" part="error" class="error" role="alert" ?hidden=${!hasError}>
          <slot name="error" @slotchange=${this.handleErrorSlotChange}>${rawError}</slot>
        </div>
      </div>
    `;
  }
}
