import { UIElement, type PropertyValues } from '@methane/core';
import { FormControlController, RovingFocusController } from '@methane/primitives';
import { html, nothing } from 'lit';
import { property } from 'lit/decorators.js';
import {
  attachDynamicSheet,
  resolveEffectiveDir,
  sanitizeCssNumber,
  stopRovingKeys,
} from '../shared/style-sheet.js';
import { availabilityPickerMessages } from './availability-picker.messages.js';
import { availabilityPickerStyles } from './availability-picker.styles.js';

export type AvailabilityDay = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun';
export type AvailabilitySchedule = Partial<Record<AvailabilityDay, ReadonlyArray<string>>>;

const DEFAULT_DAYS: ReadonlyArray<AvailabilityDay> = [
  'mon',
  'tue',
  'wed',
  'thu',
  'fri',
  'sat',
  'sun',
];

const DEFAULT_SLOTS: ReadonlyArray<string> = ['09:00', '10:00', '11:00', '14:00', '15:00'];
const DEFAULT_VALUE = '{}';

function parseSchedule(raw: string): Record<string, string[]> {
  if (!raw.trim()) return {};
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {};
    const out: Record<string, string[]> = {};
    for (const [k, v] of Object.entries(parsed)) {
      if (Array.isArray(v)) {
        out[k] = v.filter((item): item is string => typeof item === 'string');
      }
    }
    return out;
  } catch {
    return {};
  }
}

function totalSelectedSlots(schedule: Record<string, string[]>): number {
  return Object.values(schedule).reduce((acc, list) => acc + list.length, 0);
}

/**
 * `<mth-availability-picker>`: Form-associated weekly day × time-slot matrix with
 * click/drag painting, 2D RTL-aware keyboard navigation, and validation.
 */
export class MthAvailabilityPicker extends UIElement {
  static formAssociated = true;
  static override shadowRootOptions = {
    ...UIElement.shadowRootOptions,
    delegatesFocus: true,
  };
  static override messages = availabilityPickerMessages;
  static override styles = availabilityPickerStyles;

  @property({ type: String })
  name = '';

  @property({ type: String })
  value = DEFAULT_VALUE;

  @property({ type: Boolean, reflect: true })
  disabled = false;

  @property({ type: Boolean, reflect: true })
  readonly = false;

  @property({ type: Boolean, reflect: true })
  required = false;

  @property({ type: String })
  error = '';

  @property({ attribute: false })
  days: ReadonlyArray<AvailabilityDay> = DEFAULT_DAYS;

  @property({ attribute: false })
  slots: ReadonlyArray<string> = DEFAULT_SLOTS;

  private readonly formCtrl: FormControlController;
  private readonly rovingFocus: RovingFocusController;
  private dynamicSheet: CSSStyleSheet | null = null;
  private dragPaintMode: 'add' | 'remove' | null = null;
  private pointerEndAttached = false;
  private pointerHandledClick = false;

  constructor() {
    super();
    this.formCtrl = new FormControlController(this, {
      internals: this.internals,
      defaultValue: DEFAULT_VALUE,
      messages: availabilityPickerMessages,
      onValueSync: (nextValue) => {
        this.value = nextValue || DEFAULT_VALUE;
      },
      onDisabledChange: () => this.requestUpdate(),
      onSetCustomState: (stateName, active) => this.setCustomState(stateName, active),
      validator: () => {
        if (this.error.length > 0) {
          return { flags: { customError: true }, message: this.error };
        }
        const schedule = parseSchedule(this.value);
        if (this.required && totalSelectedSlots(schedule) === 0) {
          return { flags: { valueMissing: true }, message: this.t('requiredError') };
        }
        return null;
      },
    });
    this.rovingFocus = new RovingFocusController(this, {
      getItems: () => this._getSlotElements(),
      orientation: 'both',
      columns: DEFAULT_SLOTS.length,
      loop: true,
      dir: 'auto',
    });
  }

  get validity(): ValidityState | undefined {
    return this.internals?.validity;
  }

  get validationMessage(): string {
    return this.formCtrl.validationMessage;
  }

  get effectivelyDisabled(): boolean {
    return this.formCtrl.disabled;
  }

  checkValidity(): boolean {
    return this.formCtrl.checkValidity();
  }

  reportValidity(): boolean {
    return this.formCtrl.reportValidity();
  }

  getSchedule(): AvailabilitySchedule {
    return parseSchedule(this.value);
  }

  protected override onFormDisabled(disabled: boolean): void {
    this.formCtrl.handleFormDisabled(disabled);
    this.setCustomState('disabled', this.formCtrl.disabled);
  }

  protected override onFormReset(): void {
    this.formCtrl.handleFormReset();
  }

  protected override onFormStateRestore(state: string | File | FormData | null, mode: 'restore' | 'autocomplete'): void {
    this.formCtrl.handleFormStateRestore(state, mode);
  }

  override connectedCallback(): void {
    super.connectedCallback();
    if (this.shadowRoot) {
      this.dynamicSheet = attachDynamicSheet(this.shadowRoot, this.dynamicSheet);
    }
  }

  override disconnectedCallback(): void {
    this._detachPointerEnd();
    super.disconnectedCallback();
  }

  protected override firstUpdated(): void {
    if (this.shadowRoot) {
      this.dynamicSheet = attachDynamicSheet(this.shadowRoot, this.dynamicSheet);
    }
  }

  protected override willUpdate(changed: PropertyValues): void {
    super.willUpdate(changed);
    this.rovingFocus.updateOptions({
      columns: Math.max(1, this.slots.length),
      dir: resolveEffectiveDir(this, this.resolvedDir),
    });
    this.formCtrl.hostDisabled = this.disabled;
    this.formCtrl.required = this.required;
    this.formCtrl.hostReadOnly = this.readonly;
    const schedule = parseSchedule(this.value);
    const hasAny = totalSelectedSlots(schedule) > 0;
    this.formCtrl.setValue(hasAny ? this.value : this.required ? null : this.value);
    this.formCtrl.validate();
    this.setCustomState('disabled', this.formCtrl.disabled);
    this.setCustomState('readonly', this.readonly);
    this.setCustomState('required', this.required);
    this.setCustomState('invalid', this.formCtrl.invalid || this.error.length > 0);
  }

  protected override updated(): void {
    if (!this.dynamicSheet) return;
    const cols = sanitizeCssNumber(Math.max(1, this.slots.length), DEFAULT_SLOTS.length);
    this.dynamicSheet.replaceSync(`.matrix { --_slot-cols: ${cols}; }`);
  }

  setSlotEnabled(day: AvailabilityDay, slot: string, enabled: boolean): void {
    if (this.effectivelyDisabled || this.readonly) return;
    const schedule = parseSchedule(this.value);
    const current = new Set(schedule[day] ?? []);
    if (enabled) {
      current.add(slot);
    } else {
      current.delete(slot);
    }
    if (current.size === 0) {
      delete schedule[day];
    } else {
      schedule[day] = Array.from(current).sort();
    }
    this.value = JSON.stringify(schedule);
    this.emitEvent('mth-change', { detail: { value: this.value, schedule } });
  }

  toggleSlot(day: AvailabilityDay, slot: string): void {
    const schedule = parseSchedule(this.value);
    const isSet = Boolean(schedule[day]?.includes(slot));
    this.setSlotEnabled(day, slot, !isSet);
  }

  clearAll(): void {
    if (this.effectivelyDisabled || this.readonly) return;
    this.value = DEFAULT_VALUE;
    this.emitEvent('mth-change', { detail: { value: this.value, schedule: {} } });
  }

  private _getSlotElements(): HTMLElement[] {
    if (!this.shadowRoot) return [];
    return Array.from(this.shadowRoot.querySelectorAll<HTMLElement>('.slot-cell'));
  }

  private _dayLabel(day: AvailabilityDay): string {
    switch (day) {
      case 'mon':
        return this.t('dayMon');
      case 'tue':
        return this.t('dayTue');
      case 'wed':
        return this.t('dayWed');
      case 'thu':
        return this.t('dayThu');
      case 'fri':
        return this.t('dayFri');
      case 'sat':
        return this.t('daySat');
      case 'sun':
        return this.t('daySun');
    }
  }

  private readonly _onPointerUp = (): void => {
    this.dragPaintMode = null;
    this._detachPointerEnd();
  };

  private _attachPointerEnd(): void {
    if (this.pointerEndAttached || typeof window === 'undefined') return;
    window.addEventListener('pointerup', this._onPointerUp);
    this.pointerEndAttached = true;
  }

  private _detachPointerEnd(): void {
    if (!this.pointerEndAttached || typeof window === 'undefined') return;
    window.removeEventListener('pointerup', this._onPointerUp);
    this.pointerEndAttached = false;
  }

  override render() {
    const schedule = parseSchedule(this.value);
    const lockControls = this.effectivelyDisabled || this.readonly;
    const activeIndex = this.rovingFocus.currentIndex >= 0 ? this.rovingFocus.currentIndex : 0;
    const isInvalid =
      this.formCtrl.invalid || this.formCtrl.userInvalid || this.error.length > 0;
    const errorMsg = this.error || (isInvalid ? this.validationMessage : '');
    let flatIndex = 0;

    return html`
      <div
        part="base"
        class="base"
        role="group"
        aria-label=${this.t('pickerLabel')}
        aria-invalid=${isInvalid ? 'true' : nothing}
        aria-errormessage=${isInvalid && errorMsg.length > 0 ? 'mth-ap-error' : nothing}
        dir=${resolveEffectiveDir(this, this.resolvedDir)}
      >
        <div class="toolbar" @keydown=${stopRovingKeys}>
          <h3 class="heading">${this.t('pickerLabel')}</h3>
          <div>
            <slot></slot>
            <button
              type="button"
              class="clear-btn"
              ?disabled=${lockControls}
              @click=${() => this.clearAll()}
            >
              ${this.t('clearAll')}
            </button>
          </div>
        </div>

        <div part="matrix" class="matrix">
          <span></span>
          ${this.slots.map((slot) => html`<span class="slot-header">${slot}</span>`)}

          ${this.days.map(
            (day) => html`
              <span class="day-label">${this._dayLabel(day)}</span>
              ${this.slots.map((slot) => {
                const idx = flatIndex;
                flatIndex += 1;
                const enabled = Boolean(schedule[day]?.includes(slot));
                return html`
                  <button
                    type="button"
                    part="slot-cell"
                    class="slot-cell"
                    data-day=${day}
                    data-slot=${slot}
                    aria-label="${this._dayLabel(day)} ${slot}"
                    aria-pressed=${enabled ? 'true' : 'false'}
                    tabindex=${activeIndex === idx ? '0' : '-1'}
                    ?disabled=${lockControls}
                    @pointerdown=${() => {
                      if (lockControls) return;
                      this.pointerHandledClick = true;
                      const nextMode = enabled ? 'remove' : 'add';
                      this.dragPaintMode = nextMode;
                      this._attachPointerEnd();
                      this.setSlotEnabled(day, slot, nextMode === 'add');
                    }}
                    @pointerenter=${() => {
                      if (!this.dragPaintMode || lockControls) return;
                      this.setSlotEnabled(day, slot, this.dragPaintMode === 'add');
                    }}
                    @click=${() => {
                      if (this.pointerHandledClick) {
                        this.pointerHandledClick = false;
                        return;
                      }
                      this.toggleSlot(day, slot);
                    }}
                    @keydown=${(e: KeyboardEvent) => {
                      if (e.key === ' ' || e.key === 'Enter') {
                        e.preventDefault();
                        this.toggleSlot(day, slot);
                      }
                    }}
                  >
                    ${enabled ? '✓' : '—'}
                  </button>
                `;
              })}
            `,
          )}
        </div>

        <p
          id="mth-ap-error"
          part="error"
          class="error-text"
          role="alert"
          ?hidden=${errorMsg.length === 0}
        >
          ${errorMsg}
        </p>
      </div>
    `;
  }
}
