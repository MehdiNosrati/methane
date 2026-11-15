import { UIElement, type PropertyValues } from '@methane/core';
import { FormControlController, RovingFocusController } from '@methane/primitives';
import { html, nothing } from 'lit';
import { property, state } from 'lit/decorators.js';
import { ifDefined } from 'lit/directives/if-defined.js';
import { ratingMessages } from './rating.messages.js';
import { ratingStyles } from './rating.styles.js';

export type RatingSize = 'sm' | 'md' | 'lg';

/**
 * `<mth-rating>`: form-associated star rating radiogroup with RovingFocusController,
 * hover preview, half-star precision support, and RTL awareness.
 */
export class MthRating extends UIElement {
  static formAssociated = true;
  static override shadowRootOptions = { mode: 'open' as const, delegatesFocus: true };
  static override messages = ratingMessages;
  static override styles = ratingStyles;

  @property({ type: String, reflect: true })
  name = '';

  @property({ type: String })
  value = '';

  @property({ type: String, attribute: 'default-value' })
  defaultValue = '';

  @property({ type: Number })
  max = 5;

  @property({ type: String })
  label = '';

  @property({ type: String })
  hint = '';

  @property({ type: String })
  error = '';

  @property({ type: String, reflect: true })
  size: RatingSize = 'md';

  @property({ type: Number })
  precision = 1;

  @property({ type: Boolean, reflect: true })
  clearable = false;

  @property({ type: Boolean, reflect: true })
  disabled = false;

  @property({ type: Boolean, reflect: true })
  readonly = false;

  @property({ type: Boolean, reflect: true })
  required = false;

  @state()
  private hoverRating: number | null = null;

  @state()
  private slottedLabelText = '';

  @state()
  private slottedHintText = '';

  @state()
  private slottedErrorText = '';

  private readonly formCtrl: FormControlController;
  private readonly rovingCtrl: RovingFocusController;

  constructor() {
    super();

    this.formCtrl = new FormControlController(this, {
      internals: this.internals,
      defaultValue: '',
      messages: ratingMessages,
      onValueSync: (nextVal) => {
        this.value = nextVal;
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

    this.rovingCtrl = new RovingFocusController(this, {
      getItems: () => Array.from(this.shadowRoot?.querySelectorAll<HTMLElement>('[part="star"]') ?? []),
      orientation: 'horizontal',
      loop: true,
    });
  }

  get isEffectivelyDisabled(): boolean {
    return this.disabled || this.formCtrl.disabled;
  }

  get numericValue(): number {
    const parsed = Number(this.value);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
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

    if (changed.has('value')) {
      this.formCtrl.setValue(this.value, { markDirty: false });
      const activeIdx = Math.max(0, Math.min(this.getSafeMax() - 1, Math.ceil(this.numericValue) - 1));
      if (this.numericValue > 0) {
        this.rovingCtrl.setActiveIndex(activeIdx, false);
      }
    }

    if (changed.has('required') || changed.has('disabled') || changed.has('readonly') || changed.has('error')) {
      this.formCtrl.required = this.required;
      this.formCtrl.hostDisabled = this.disabled;
      this.formCtrl.hostReadOnly = this.readonly;
      this.formCtrl.validate();
    }
  }

  override updated(changed: PropertyValues<this>): void {
    super.updated(changed);
    if (changed.has('max')) {
      this.rovingCtrl.updateOptions({
        orientation: 'horizontal',
        loop: true,
      });
    }
  }

  override focus(options?: FocusOptions): void {
    const first = this.shadowRoot?.querySelector<HTMLElement>('[part="star"][tabindex="0"]')
      ?? this.shadowRoot?.querySelector<HTMLElement>('[part="star"]');
    first?.focus(options);
  }

  checkValidity(): boolean {
    return this.formCtrl.checkValidity();
  }

  reportValidity(): boolean {
    return this.formCtrl.reportValidity();
  }

  private getSafeMax(): number {
    return this.max >= 1 && Number.isFinite(this.max) ? Math.floor(this.max) : 5;
  }

  private isRtl(): boolean {
    if (typeof getComputedStyle === 'function') {
      const dir = getComputedStyle(this).direction;
      if (dir === 'rtl') return true;
      if (dir === 'ltr') return false;
    }
    return this.getAttribute('dir') === 'rtl';
  }

  private selectRating(rawRating: number): void {
    if (this.isEffectivelyDisabled || this.readonly) return;
    const bounded = Math.min(this.getSafeMax(), Math.max(0, rawRating));
    const shouldClear = this.clearable && this.value === String(bounded);
    const nextValue = shouldClear ? '' : String(bounded);
    const nextNumeric = shouldClear ? 0 : bounded;

    this.value = nextValue;
    this.formCtrl.setValue(nextValue);
    this.formCtrl.markDirty();
    this.rovingCtrl.setActiveIndex(Math.max(0, Math.ceil(nextNumeric || 1) - 1), false);

    this.dispatchEvent(
      new CustomEvent('mth-change', {
        detail: { value: nextValue, rating: nextNumeric },
        bubbles: true,
        composed: true,
      }),
    );
  }

  private computeStarRating(index: number, event: MouseEvent): number {
    if (this.precision === 0.5 && event.clientX !== 0) {
      const target = event.currentTarget as HTMLElement;
      const rect = target.getBoundingClientRect();
      if (rect.width > 0) {
        const offset = this.isRtl() ? rect.right - event.clientX : event.clientX - rect.left;
        if (offset <= rect.width / 2) {
          return index - 0.5;
        }
      }
    }
    return index;
  }

  private handleStarKeyDown(index: number, event: KeyboardEvent): void {
    if (this.isEffectivelyDisabled || this.readonly) return;
    if (event.key === ' ' || event.key === 'Enter') {
      event.preventDefault();
      this.selectRating(index);
    }
  }

  private getStarState(index: number, activeValue: number): 'full' | 'half' | 'empty' {
    if (activeValue >= index) return 'full';
    if (activeValue >= index - 0.5) return 'half';
    return 'empty';
  }

  private renderStarSvg() {
    return html`
      <svg class="star-icon" viewBox="0 0 24 24" aria-hidden="true">
        <path
          d="M12 2.5l2.93 5.94 6.56.95-4.74 4.62 1.12 6.53L12 17.45l-5.87 3.09 1.12-6.53L2.51 9.39l6.56-.95L12 2.5z"
        ></path>
      </svg>
    `;
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
    const maxStars = this.getSafeMax();
    const displayValue = this.hoverRating ?? this.numericValue;
    const selectedCeil = Math.ceil(this.numericValue);
    const hasLabel = Boolean(this.label || this.slottedLabelText);
    const hasHint = Boolean(this.hint || this.slottedHintText);
    const hasError = Boolean(this.error || this.slottedErrorText);
    const describedByIds: Array<string> = [];
    if (hasHint) describedByIds.push('mth-rating-hint');
    if (hasError) describedByIds.push('mth-rating-error');

    const indices = Array.from({ length: maxStars }, (_, i) => i + 1);

    return html`
      <div part="base" class="base">
        <span id="mth-rating-label" part="label" class="label" ?hidden=${!hasLabel}>
          <slot name="label" @slotchange=${this.handleLabelSlotChange}>${this.label}</slot>
        </span>

        <div
          part="group"
          class="group"
          role="radiogroup"
          aria-labelledby=${ifDefined(hasLabel ? 'mth-rating-label' : undefined)}
          aria-label=${ifDefined(!hasLabel ? this.label || 'Rating' : undefined)}
          aria-describedby=${ifDefined(describedByIds.length > 0 ? describedByIds.join(' ') : undefined)}
          aria-disabled=${this.isEffectivelyDisabled ? 'true' : 'false'}
          @mouseleave=${() => {
            this.hoverRating = null;
          }}
        >
          ${indices.map((index) => {
            const state = this.getStarState(index, displayValue);
            const isChecked = this.numericValue > 0 && selectedCeil === index;
            return html`
              <button
                type="button"
                part="star"
                class="star"
                role="radio"
                data-state=${state}
                aria-checked=${isChecked ? 'true' : 'false'}
                aria-label=${ratingMessages.starAriaPattern
                  .replace('{index}', String(index))
                  .replace('{max}', String(maxStars))}
                ?disabled=${this.isEffectivelyDisabled}
                aria-disabled=${this.isEffectivelyDisabled ? 'true' : 'false'}
                @mousemove=${(e: MouseEvent) => {
                  if (!this.isEffectivelyDisabled && !this.readonly) {
                    this.hoverRating = this.computeStarRating(index, e);
                  }
                }}
                @click=${(e: MouseEvent) => {
                  this.selectRating(this.computeStarRating(index, e));
                }}
                @keydown=${(e: KeyboardEvent) => this.handleStarKeyDown(index, e)}
              >
                <span part="icon">${this.renderStarSvg()}</span>
                ${state === 'half'
                  ? html`<span class="star-half-overlay" aria-hidden="true">${this.renderStarSvg()}</span>`
                  : nothing}
              </button>
            `;
          })}
        </div>

        <div id="mth-rating-hint" part="hint" class="hint" ?hidden=${!hasHint}>
          <slot name="hint" @slotchange=${this.handleHintSlotChange}>${this.hint}</slot>
        </div>

        <div id="mth-rating-error" part="error" class="error" role="alert" ?hidden=${!hasError}>
          <slot name="error" @slotchange=${this.handleErrorSlotChange}>${this.error}</slot>
        </div>
      </div>
    `;
  }
}
