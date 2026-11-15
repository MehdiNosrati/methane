import { UIElement, type PropertyValues } from '@methane/core';
import {
  CalendarCore,
  FormControlController,
  FormattingUtils,
  type CalendarDate,
} from '@methane/primitives';
import { html } from 'lit';
import { property, state } from 'lit/decorators.js';
import { bookingWidgetMessages } from './booking-widget.messages.js';
import { bookingWidgetStyles } from './booking-widget.styles.js';

export interface BookingDaySlots {
  readonly date: string;
  readonly slots: ReadonlyArray<string>;
}

const FALLBACK_SLOTS = ['09:00', '10:30', '13:00', '14:30', '16:00'] as const;

function splitBookingValue(val: string): { date: string; time: string } {
  const idx = val.indexOf('T');
  if (idx === -1) return { date: val, time: '' };
  return { date: val.slice(0, idx), time: val.slice(idx + 1) };
}

function parseIso(iso: string): CalendarDate | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso.trim());
  if (!m) return null;
  return { year: Number(m[1]), month: Number(m[2]), day: Number(m[3]) };
}

/**
 * `<mth-booking-widget>`: Form-associated appointment booking widget with
 * CalendarCore date picker, time-slot selector, summary, and validation.
 */
export class MthBookingWidget extends UIElement {
  static formAssociated = true;
  static override shadowRootOptions = {
    ...UIElement.shadowRootOptions,
    delegatesFocus: true,
  };
  static override messages = bookingWidgetMessages;
  static override styles = bookingWidgetStyles;

  @property({ type: String })
  name = '';

  @property({ type: String })
  value = '';

  @property({ type: Boolean, reflect: true })
  disabled = false;

  @property({ type: Boolean, reflect: true })
  readonly = false;

  @property({ type: Boolean, reflect: true })
  required = false;

  @property({ type: String })
  error = '';

  @property({ attribute: false })
  availableSlots: ReadonlyArray<BookingDaySlots> = [];

  @property({ attribute: false })
  defaultSlots: ReadonlyArray<string> = FALLBACK_SLOTS;

  @state()
  private selectedDate = '2026-11-15';

  @state()
  private selectedTime = '';

  private readonly calendar: CalendarCore;
  private readonly formCtrl: FormControlController;

  constructor() {
    super();
    this.calendar = new CalendarCore(
      {
        locale: 'en-US',
        initialFocusDate: { year: 2026, month: 11, day: 15 },
      },
      this,
    );
    this.formCtrl = new FormControlController(this, {
      internals: this.internals,
      defaultValue: '',
      messages: bookingWidgetMessages,
      onValueSync: (nextValue) => {
        this.value = nextValue ?? '';
        const parts = splitBookingValue(this.value);
        if (parts.date) {
          this.selectedDate = parts.date;
        }
        this.selectedTime = parts.time;
      },
      onDisabledChange: () => this.requestUpdate(),
      onSetCustomState: (stateName, active) => this.setCustomState(stateName, active),
      validator: () => {
        if (this.error.length > 0) {
          return { flags: { customError: true }, message: this.error };
        }
        if (this.required && !this.value.trim()) {
          return { flags: { valueMissing: true }, message: this.t('requiredError') };
        }
        return null;
      },
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

  protected override onFormDisabled(disabled: boolean): void {
    this.formCtrl.handleFormDisabled(disabled);
  }

  protected override onFormReset(): void {
    this.formCtrl.handleFormReset();
  }

  protected override onFormStateRestore(state: string | File | FormData | null, mode: 'restore' | 'autocomplete'): void {
    this.formCtrl.handleFormStateRestore(state, mode);
  }

  protected override willUpdate(changed: PropertyValues): void {
    super.willUpdate(changed);
    this.calendar.setLocale(this.resolvedLocale);
    if (changed.has('value')) {
      const parts = splitBookingValue(this.value);
      if (parts.date) {
        this.selectedDate = parts.date;
        const parsed = parseIso(parts.date);
        if (parsed) this.calendar.selectDate(parsed);
      }
      this.selectedTime = parts.time;
    }
    this.formCtrl.hostDisabled = this.disabled;
    this.formCtrl.required = this.required;
    this.formCtrl.hostReadOnly = this.readonly;
    this.formCtrl.setValue(this.value.trim() ? this.value : null);
    this.formCtrl.validate();
  }

  selectSlot(date: string, time: string): void {
    if (this.effectivelyDisabled || this.readonly) return;
    this.selectedDate = date;
    this.selectedTime = time;
    this.value = time ? `${date}T${time}` : '';
    const parsed = parseIso(date);
    if (parsed) {
      this.calendar.selectDate(parsed);
    }
    this.emitEvent('mth-change', {
      detail: { value: this.value, date: this.selectedDate, time: this.selectedTime },
    });
  }

  confirm(): void {
    if (this.effectivelyDisabled || this.readonly || !this.value) return;
    this.emitEvent('mth-confirm', {
      detail: { value: this.value, date: this.selectedDate, time: this.selectedTime },
    });
  }

  private _slotsForDate(dateIso: string): ReadonlyArray<string> {
    const override = this.availableSlots.find((s) => s.date === dateIso);
    return override ? override.slots : this.defaultSlots;
  }

  override render() {
    const f = this.calendar.focusedDate;
    const monthLabel = FormattingUtils.formatDate(
      new Date(Date.UTC(f.year, f.month - 1, f.day)),
      this.resolvedLocale,
      { month: 'long', year: 'numeric', timeZone: 'UTC' },
    );
    const weekdays = this.calendar.getWeekdayHeaders('short');
    const cells = this.calendar.getMonthGrid(f.year, f.month).flat();
    const daySlots = this._slotsForDate(this.selectedDate);
    const lockControls = this.effectivelyDisabled || this.readonly;

    return html`
      <div
        part="base"
        class="base"
        role="group"
        aria-label=${this.t('widgetLabel')}
        dir=${this.resolvedDir}
      >
        <div part="calendar" class="calendar">
          <div class="cal-header">
            <button
              type="button"
              class="btn"
              ?disabled=${lockControls}
              @click=${() => this.calendar.navigateByMonths(-1)}
            >
              ${this.t('prevMonth')}
            </button>
            <h3 class="heading">${monthLabel}</h3>
            <button
              type="button"
              class="btn"
              ?disabled=${lockControls}
              @click=${() => this.calendar.navigateByMonths(1)}
            >
              ${this.t('nextMonth')}
            </button>
          </div>

          <div class="weekdays">
            ${weekdays.map((d) => html`<span class="weekday">${d}</span>`)}
          </div>

          <div class="days">
            ${cells.map(
              (cell) => html`
                <button
                  type="button"
                  class="day-btn"
                  data-date=${cell.iso}
                  data-outside=${cell.inMonth ? 'false' : 'true'}
                  aria-pressed=${this.selectedDate === cell.iso ? 'true' : 'false'}
                  ?disabled=${lockControls || cell.isDisabled}
                  @click=${() => {
                    const nextSlots = this._slotsForDate(cell.iso);
                    const nextTime = nextSlots.includes(this.selectedTime)
                      ? this.selectedTime
                      : (nextSlots[0] ?? '');
                    this.selectSlot(cell.iso, nextTime);
                  }}
                >
                  ${cell.date.day}
                </button>
              `,
            )}
          </div>
        </div>

        <div part="slots" class="slots-panel">
          <h3 class="heading">${this.t('selectTimeHeading')}</h3>
          <div class="slot-list">
            ${daySlots.map(
              (slot) => html`
                <button
                  type="button"
                  class="slot-btn"
                  data-slot=${slot}
                  aria-pressed=${this.selectedTime === slot ? 'true' : 'false'}
                  ?disabled=${lockControls}
                  @click=${() => this.selectSlot(this.selectedDate, slot)}
                >
                  ${slot}
                </button>
              `,
            )}
          </div>

          <div part="summary" class="summary">
            <span>
              <strong>${this.t('summaryLabel')}:</strong>
              ${this.value ? this.value : this.t('noSelection')}
            </span>
            <slot></slot>
            <p class="error-text" role="alert" ?hidden=${!(this.formCtrl.userInvalid || this.error)}>
              ${this.validationMessage}
            </p>
            <button
              type="button"
              class="btn confirm-btn"
              ?disabled=${lockControls || !this.value}
              @click=${() => this.confirm()}
            >
              ${this.t('confirmBooking')}
            </button>
          </div>
        </div>
      </div>
    `;
  }
}
