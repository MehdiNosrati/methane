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
import { dateRangePickerMessages } from './date-range-picker.messages.js';
import { dateRangePickerStyles } from './date-range-picker.styles.js';

function parseIsoDate(iso: string): CalendarDate | undefined {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso.trim());
  if (!m) return undefined;
  return { year: Number(m[1]), month: Number(m[2]), day: Number(m[3]) };
}

/**
 * Form-associated ISO date range picker powered by `CalendarCore({ mode: 'range' })`.
 */
export class MthDateRangePicker extends UIElement {
  static formAssociated = true;

  static override shadowRootOptions: ShadowRootInit = {
    mode: 'open',
    delegatesFocus: true,
  };

  static override styles = dateRangePickerStyles;
  static override messages = dateRangePickerMessages;

  @property({ type: String })
  value = '';

  @property({ type: String, attribute: 'start-date' })
  startDate = '';

  @property({ type: String, attribute: 'end-date' })
  endDate = '';

  @property({ type: String, reflect: true })
  name = '';

  @property({ type: String })
  label = '';

  @property({ type: String })
  placeholder = 'YYYY-MM-DD/YYYY-MM-DD';

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
    this.calendar = new CalendarCore({ mode: 'range' }, this);

    this.formCtrl = new FormControlController(this, {
      internals: this.internals,
      defaultValue: '',
      messages: dateRangePickerMessages,
      onValueSync: (nextValue) => {
        this.value = nextValue;
        this.syncFromRangeValue(nextValue);
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
    if (this.value) {
      this.syncFromRangeValue(this.value);
    } else if (this.startDate || this.endDate) {
      const nextValue =
        this.startDate && this.endDate
          ? `${this.startDate}/${this.endDate}`
          : this.startDate || '';
      this.value = nextValue;
      this.formCtrl.setDefaultValue(nextValue);
      this.formCtrl.setValue(nextValue, { markDirty: false });
      this.syncCalendarRange(this.startDate, this.endDate);
    } else {
      this.syncFromRangeValue('');
    }
  }

  protected override willUpdate(changed: PropertyValues): void {
    super.willUpdate(changed);
    this.calendar.setLocale(this.resolvedLocale);
    if (changed.has('disabled')) {
      this.formCtrl.hostDisabled = this.disabled;
    }
    if (changed.has('required')) {
      this.formCtrl.required = this.required;
    }
    if (changed.has('readonly')) {
      this.formCtrl.hostReadOnly = this.readonly;
    }
    const hasStartOrEndChange = changed.has('startDate') || changed.has('endDate');
    if (changed.has('value') && (this.value !== '' || !hasStartOrEndChange)) {
      this.formCtrl.setValue(this.value, { markDirty: false });
      this.syncFromRangeValue(this.value);
    } else if (hasStartOrEndChange) {
      const nextValue =
        this.startDate && this.endDate
          ? `${this.startDate}/${this.endDate}`
          : this.startDate || '';
      if (nextValue !== this.value) {
        this.value = nextValue;
        this.formCtrl.setValue(nextValue, { markDirty: false });
      }
      this.syncCalendarRange(this.startDate, this.endDate);
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

  private syncFromRangeValue(val: string): void {
    const [rawStart = '', rawEnd = ''] = val.split('/');
    const s = parseIsoDate(rawStart);
    const e = parseIsoDate(rawEnd);
    this.startDate = s ? formatIsoDate(s) : '';
    this.endDate = e ? formatIsoDate(e) : '';
    this.syncCalendarRange(this.startDate, this.endDate);
  }

  private syncCalendarRange(startStr: string, endStr: string): void {
    const s = parseIsoDate(startStr);
    const e = parseIsoDate(endStr);
    if (s) {
      if (this.calendar.rangeStart && !this.calendar.rangeEnd) {
        this.calendar.selectDate(s);
      }
      this.calendar.selectDate(s);
      if (e) {
        this.calendar.selectDate(e);
      }
      this.calendar.setFocusedDate(s);
      this.viewYear = s.year;
      this.viewMonth = s.month;
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
    const safeX = Number.isFinite(x) ? Math.round(x) : 0;
    const safeY = Number.isFinite(y) ? Math.round(y) : 0;
    this.positionSheet.replaceSync(
      `[part="popover"] { transform: translate3d(${safeX}px, ${safeY}px, 0); }`,
    );
  }

  private commitRange(startStr: string, endStr: string): void {
    const nextValue = startStr && endStr ? `${startStr}/${endStr}` : startStr;
    this.startDate = startStr;
    this.endDate = endStr;
    this.value = nextValue;
    this.formCtrl.setValue(nextValue, { markDirty: true });
    this.formCtrl.markTouched();
    this.emitEvent('mth-change', {
      detail: { value: nextValue, startDate: startStr, endDate: endStr },
    });
  }

  private readonly handleInputChange = (): void => {
    const raw = this.inputEl?.value.trim() ?? '';
    if (!raw) {
      this.commitRange('', '');
      return;
    }
    const [s = '', e = ''] = raw.split('/');
    if (parseIsoDate(s) && (!e || parseIsoDate(e))) {
      this.commitRange(s.trim(), e.trim());
    }
  };

  private readonly handleTriggerClick = (): void => {
    if (this.open) {
      void this.hide('invoker');
    } else {
      void this.show();
    }
  };

  private readonly handleGridKeyDown = (event: KeyboardEvent): void => {
    const isRtl =
      (this.closest('[dir]')?.getAttribute('dir')?.toLowerCase() ?? this.resolvedDir) === 'rtl';
    let deltaDays = 0;
    if (event.key === 'ArrowLeft') deltaDays = isRtl ? 1 : -1;
    else if (event.key === 'ArrowRight') deltaDays = isRtl ? -1 : 1;
    else if (event.key === 'ArrowUp') deltaDays = -7;
    else if (event.key === 'ArrowDown') deltaDays = 7;

    if (deltaDays !== 0) {
      event.preventDefault();
      const next = this.calendar.navigateByDays(deltaDays);
      this.viewYear = next.year;
      this.viewMonth = next.month;
      return;
    }

    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      this.handleDayClick(this.calendar.focusedDate);
    }
  };

  private readonly handleDayClick = (date: CalendarDate): void => {
    if (this.effectivelyDisabled || this.readonly) return;
    this.calendar.selectDate(date);
    const rs = this.calendar.rangeStart ? formatIsoDate(this.calendar.rangeStart) : '';
    const re = this.calendar.rangeEnd ? formatIsoDate(this.calendar.rangeEnd) : '';
    this.commitRange(rs, re);
    if (rs && re) {
      void this.hide('programmatic');
    }
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
    const focusedIso = formatIsoDate(this.calendar.focusedDate);
    const monthTitle = FormattingUtils.formatDate(
      new Date(Date.UTC(this.viewYear, this.viewMonth - 1, 1)),
      this.resolvedLocale,
      { month: 'long', year: 'numeric', timeZone: 'UTC' },
    );

    return html`
      <div part="base">
        ${this.label
          ? html`<label part="label" for="mth-drp-input">${this.label}</label>`
          : nothing}
        <div part="control">
          <input
            id="mth-drp-input"
            part="input"
            type="text"
            .value=${this.value}
            placeholder=${this.placeholder}
            aria-label=${this.label || this.t('chooseRange')}
            ?disabled=${isDisabled}
            ?readonly=${this.readonly}
            ?required=${this.required}
            @change=${this.handleInputChange}
          />
          <button
            part="trigger"
            type="button"
            aria-label=${this.t('chooseRange')}
            aria-expanded=${this.open ? 'true' : 'false'}
            aria-haspopup="dialog"
            aria-controls="mth-drp-popover"
            ?disabled=${isDisabled || this.readonly}
            @click=${this.handleTriggerClick}
          >
            &#128197;
          </button>
        </div>
        <div
          id="mth-drp-popover"
          part="popover"
          role="dialog"
          aria-label=${this.t('chooseRange')}
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
          <div part="grid" role="grid" @keydown=${this.handleGridKeyDown}>
            <div class="weekdays" role="row">
              ${weekdays.map((wd) => html`<span class="weekday" role="columnheader">${wd}</span>`)}
            </div>
            ${weeks.map(
              (week) => html`
                <div class="week-row" role="row">
                  ${week.map((cell) => {
                    const isEdge = cell.iso === this.startDate || cell.iso === this.endDate || cell.isRangeStart || cell.isRangeEnd;
                    const inSpan =
                      cell.isInRange ||
                      (Boolean(this.startDate && this.endDate) &&
                        cell.iso > this.startDate &&
                        cell.iso < this.endDate);
                    return html`
                      <button
                        part="day"
                        type="button"
                        role="gridcell"
                        tabindex=${cell.iso === focusedIso ? '0' : '-1'}
                        data-iso=${cell.iso}
                        data-outside=${cell.inMonth ? 'false' : 'true'}
                        data-in-range=${inSpan ? 'true' : 'false'}
                        aria-selected=${isEdge ? 'true' : 'false'}
                        ?disabled=${cell.isDisabled}
                        @click=${() => this.handleDayClick(cell.date)}
                      >
                        ${cell.date.day}
                      </button>
                    `;
                  })}
                </div>
              `,
            )}
          </div>
        </div>
      </div>
    `;
  }
}
