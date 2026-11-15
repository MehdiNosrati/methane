import { UIElement, type PropertyValues, html, nothing, property, query, state } from '@methane/core';
import {
  CalendarCore,
  type CalendarDate,
  FormControlController,
  FormattingUtils,
  OverlayController,
  PositioningController,
  formatIsoDate,
} from '@methane/primitives';
import { datetimePickerMessages } from './datetime-picker.messages.js';
import { datetimePickerStyles } from './datetime-picker.styles.js';

function splitIsoDatetime(value: string): { dateStr: string; timeStr: string } {
  const m = /^(\d{4}-\d{2}-\d{2})T([0-2]\d:[0-5]\d)/.exec(value.trim());
  if (!m) return { dateStr: '', timeStr: '09:00' };
  return { dateStr: m[1] ?? '', timeStr: m[2] ?? '09:00' };
}

function parseDatePart(iso: string): CalendarDate | undefined {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!m) return undefined;
  return { year: Number(m[1]), month: Number(m[2]), day: Number(m[3]) };
}

/**
 * Form-associated combined date and time picker (`YYYY-MM-DDTHH:MM`).
 */
export class MthDatetimePicker extends UIElement {
  static formAssociated = true;

  static override shadowRootOptions: ShadowRootInit = {
    mode: 'open',
    delegatesFocus: true,
  };

  static override styles = datetimePickerStyles;
  static override messages = datetimePickerMessages;

  @property({ type: String })
  value = '';

  @property({ type: String, reflect: true })
  name = '';

  @property({ type: String })
  label = '';

  @property({ type: String })
  placeholder = 'YYYY-MM-DDTHH:MM';

  @property({ type: Boolean, reflect: true })
  open = false;

  @property({ type: Boolean, reflect: true })
  disabled = false;

  @property({ type: Boolean, reflect: true })
  readonly = false;

  @property({ type: Boolean, reflect: true })
  required = false;

  @state()
  private viewYear = 2026;

  @state()
  private viewMonth = 1;

  @state()
  private selectedDatePart = '';

  @state()
  private selectedTimePart = '09:00';

  @query('[part="control"]')
  private controlEl!: HTMLElement | null;

  @query('[part="input"]')
  private inputEl!: HTMLInputElement | null;

  @query('[part="trigger"]')
  private triggerEl!: HTMLButtonElement | null;

  @query('[part="popover"]')
  private popoverEl!: HTMLElement | null;

  private readonly calendar: CalendarCore;
  private readonly formCtrl: FormControlController;
  private readonly overlayCtrl: OverlayController;
  private readonly positioningCtrl: PositioningController;
  private positionSheet: CSSStyleSheet | null = null;

  constructor() {
    super();
    this.calendar = new CalendarCore({ mode: 'single' }, this);

    this.formCtrl = new FormControlController(this, {
      internals: this.internals,
      defaultValue: '',
      messages: datetimePickerMessages,
      onValueSync: (nextValue) => {
        this.value = nextValue;
        this.syncPartsFromValue(nextValue);
      },
      onDisabledChange: () => {
        this.requestUpdate();
      },
      onSetCustomState: (stateName, active) => {
        this.setCustomState(stateName, active);
      },
    });

    this.overlayCtrl = new OverlayController(this, {
      mode: 'popover',
      closeOnEscape: true,
      lightDismiss: true,
      restoreFocus: true,
      surface: () => this.popoverEl,
      trigger: () => (this.shadowRoot?.activeElement === this.triggerEl ? this.triggerEl : null),
      onSetCustomState: (stateName, active) => {
        this.setCustomState(stateName, active);
      },
      onOpenChange: (open) => {
        this.open = open;
        if (open) {
          this.positioningCtrl.reposition();
        }
      },
    });

    this.positioningCtrl = new PositioningController(this, {
      anchor: () => this.controlEl,
      floating: () => this.popoverEl,
      placement: 'bottom-start',
      offset: 4,
      autoUpdate: true,
      onPosition: (res) => {
        this.applyPopoverPosition(res.x, res.y);
      },
    });
  }

  get validity(): ValidityState | undefined {
    return this.internals?.validity;
  }

  get validationMessage(): string {
    return this.formCtrl.validationMessage || this.internals?.validationMessage || '';
  }

  get form(): HTMLFormElement | null {
    return this.internals?.form ?? this.closest('form');
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

  protected override onFirstConnect(): void {
    const initialDefault = this.getAttribute('value') ?? this.value ?? '';
    this.formCtrl.setDefaultValue(initialDefault);
    this.formCtrl.setValue(this.value, { markDirty: false });
    this.calendar.setLocale(this.resolvedLocale);
    this.syncPartsFromValue(this.value);
  }

  protected override willUpdate(changed: PropertyValues): void {
    super.willUpdate(changed);
    if (changed.has('disabled')) {
      this.formCtrl.hostDisabled = this.disabled;
    }
    if (changed.has('required')) {
      this.formCtrl.required = this.required;
    }
    if (changed.has('readonly')) {
      this.formCtrl.hostReadOnly = this.readonly;
    }
    if (changed.has('value')) {
      this.formCtrl.setValue(this.value, { markDirty: false });
      this.syncPartsFromValue(this.value);
    }
  }

  protected override updated(changed: PropertyValues): void {
    super.updated(changed);
    if (changed.has('readonly')) {
      this.setCustomState('readonly', this.readonly);
    }
    if (changed.has('open') && this.open) {
      this.positioningCtrl.reposition();
    }
  }

  async show(): Promise<void> {
    if (this.effectivelyDisabled || this.readonly) return;
    await this.overlayCtrl.show();
  }

  async hide(reason: 'escape' | 'outside' | 'programmatic' | 'invoker' = 'programmatic'): Promise<void> {
    await this.overlayCtrl.hide(reason);
  }

  private syncPartsFromValue(val: string): void {
    const { dateStr, timeStr } = splitIsoDatetime(val);
    this.selectedDatePart = dateStr;
    this.selectedTimePart = timeStr;
    const parsed = parseDatePart(dateStr);
    if (parsed) {
      this.calendar.setFocusedDate(parsed);
      this.viewYear = parsed.year;
      this.viewMonth = parsed.month;
    }
  }

  private applyPopoverPosition(x: number, y: number): void {
    if (
      typeof CSSStyleSheet === 'undefined' ||
      !this.shadowRoot ||
      !('adoptedStyleSheets' in this.shadowRoot)
    ) {
      return;
    }
    if (!this.positionSheet) {
      this.positionSheet = new CSSStyleSheet();
      this.shadowRoot.adoptedStyleSheets = [
        ...this.shadowRoot.adoptedStyleSheets,
        this.positionSheet,
      ];
    }
    this.positionSheet.replaceSync(
      `[part="popover"] { transform: translate3d(${Math.round(x)}px, ${Math.round(y)}px, 0); }`,
    );
  }

  private commitCombined(dateStr: string, timeStr: string): void {
    if (this.effectivelyDisabled || this.readonly) return;
    this.selectedDatePart = dateStr;
    this.selectedTimePart = timeStr;
    const combined = dateStr ? `${dateStr}T${timeStr}` : '';
    this.value = combined;
    this.formCtrl.setValue(combined, { markDirty: true });
    this.formCtrl.markTouched();
    this.emitEvent('mth-change', { detail: { value: combined } });
  }

  private readonly handleInputChange = (): void => {
    const next = this.inputEl?.value.trim() ?? '';
    if (!next) {
      this.commitCombined('', this.selectedTimePart);
      return;
    }
    const parts = splitIsoDatetime(next);
    if (parts.dateStr) {
      this.commitCombined(parts.dateStr, parts.timeStr);
    }
  };

  private readonly handleTriggerClick = (): void => {
    if (this.open) {
      void this.hide('invoker');
    } else {
      void this.show();
    }
  };

  private readonly handleDayClick = (date: CalendarDate, iso: string): void => {
    this.calendar.setFocusedDate(date);
    this.calendar.selectDate(date);
    this.commitCombined(iso, this.selectedTimePart);
  };

  private readonly handleTimeInputChange = (event: Event): void => {
    const timeVal = (event.target as HTMLInputElement).value || '09:00';
    const datePart = this.selectedDatePart || formatIsoDate(this.calendar.focusedDate);
    this.commitCombined(datePart, timeVal);
  };

  private readonly handlePrevMonth = (): void => {
    const d = this.calendar.navigateByMonths(-1);
    this.viewYear = d.year;
    this.viewMonth = d.month;
  };

  private readonly handleNextMonth = (): void => {
    const d = this.calendar.navigateByMonths(1);
    this.viewYear = d.year;
    this.viewMonth = d.month;
  };

  override render() {
    const isDisabled = this.effectivelyDisabled;
    const weeks = this.calendar.getMonthGrid(this.viewYear, this.viewMonth);
    const weekdays = this.calendar.getWeekdayHeaders('short');
    const monthTitle = FormattingUtils.formatDate(
      new Date(Date.UTC(this.viewYear, this.viewMonth - 1, 1)),
      this.resolvedLocale,
      { month: 'long', year: 'numeric', timeZone: 'UTC' },
    );

    return html`
      <div part="base">
        ${this.label
          ? html`<label part="label" for="mth-dtp-input">${this.label}</label>`
          : nothing}
        <div part="control">
          <input
            id="mth-dtp-input"
            part="input"
            type="text"
            .value=${this.value}
            placeholder=${this.placeholder}
            aria-label=${this.label || this.t('chooseDatetime')}
            ?disabled=${isDisabled}
            ?readonly=${this.readonly}
            ?required=${this.required}
            @change=${this.handleInputChange}
          />
          <button
            part="trigger"
            type="button"
            aria-label=${this.t('chooseDatetime')}
            aria-expanded=${this.open ? 'true' : 'false'}
            aria-haspopup="dialog"
            aria-controls="mth-dtp-popover"
            ?disabled=${isDisabled || this.readonly}
            @click=${this.handleTriggerClick}
          >
            &#128197;
          </button>
        </div>
        <div
          id="mth-dtp-popover"
          part="popover"
          role="dialog"
          aria-label=${this.t('chooseDatetime')}
          ?hidden=${!this.open}
        >
          <div class="header">
            <button
              class="nav-btn"
              type="button"
              aria-label=${this.t('previousMonth')}
              @click=${this.handlePrevMonth}
            >
              &lsaquo;
            </button>
            <span class="month-title">${monthTitle}</span>
            <button
              class="nav-btn"
              type="button"
              aria-label=${this.t('nextMonth')}
              @click=${this.handleNextMonth}
            >
              &rsaquo;
            </button>
          </div>
          <div role="grid">
            <div class="weekdays" role="row">
              ${weekdays.map((wd) => html`<span class="weekday" role="columnheader">${wd}</span>`)}
            </div>
            ${weeks.map(
              (week) => html`
                <div class="week-row" role="row">
                  ${week.map((cell) => html`
                    <button
                      part="day"
                      type="button"
                      role="gridcell"
                      data-iso=${cell.iso}
                      data-outside=${cell.inMonth ? 'false' : 'true'}
                      aria-selected=${cell.iso === this.selectedDatePart ? 'true' : 'false'}
                      ?disabled=${cell.isDisabled}
                      @click=${() => this.handleDayClick(cell.date, cell.iso)}
                    >
                      ${cell.date.day}
                    </button>
                  `)}
                </div>
              `,
            )}
          </div>
          <div class="time-footer">
            <label for="mth-dtp-time">${this.t('timeLabel')}</label>
            <input
              id="mth-dtp-time"
              part="time-input"
              type="time"
              .value=${this.selectedTimePart}
              @change=${this.handleTimeInputChange}
            />
            <button class="done-btn" type="button" @click=${() => void this.hide('programmatic')}>
              ${this.t('apply')}
            </button>
          </div>
        </div>
      </div>
    `;
  }
}
