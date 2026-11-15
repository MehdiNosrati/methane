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
import { datePickerMessages } from './date-picker.messages.js';
import { datePickerStyles } from './date-picker.styles.js';

function parseIsoDate(iso: string): CalendarDate | undefined {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso.trim());
  if (!m) return undefined;
  const year = Number(m[1]);
  const month = Number(m[2]);
  const day = Number(m[3]);
  if (month < 1 || month > 12 || day < 1 || day > 31) return undefined;
  return { year, month, day };
}

/**
 * Form-associated accessible date picker with CalendarCore engine and floating popover.
 */
export class MthDatePicker extends UIElement {
  static formAssociated = true;

  static override shadowRootOptions: ShadowRootInit = {
    mode: 'open',
    delegatesFocus: true,
  };

  static override styles = datePickerStyles;
  static override messages = datePickerMessages;

  @property({ type: String })
  value = '';

  @property({ type: String, reflect: true })
  name = '';

  @property({ type: String })
  label = '';

  @property({ type: String })
  placeholder = 'YYYY-MM-DD';

  @property({ type: String })
  min = '';

  @property({ type: String })
  max = '';

  @property({ type: Boolean, reflect: true })
  open = false;

  @property({ type: Boolean, reflect: true })
  disabled = false;

  @property({ type: Boolean, reflect: true })
  readonly = false;

  @property({ type: Boolean, reflect: true })
  required = false;

  @state()
  private viewYear = new Date().getFullYear();

  @state()
  private viewMonth = new Date().getMonth() + 1;

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
      messages: datePickerMessages,
      onValueSync: (nextValue) => {
        this.value = nextValue;
        this.syncCalendarFromValue(nextValue);
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
    this.syncCalendarFromValue(this.value);
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
      this.syncCalendarFromValue(this.value);
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

  private syncCalendarFromValue(val: string): void {
    const parsed = parseIsoDate(val);
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

  private isIsoDisabled(iso: string): boolean {
    if (this.min && iso < this.min) return true;
    if (this.max && iso > this.max) return true;
    return false;
  }

  private commitDate(iso: string): void {
    if (this.effectivelyDisabled || this.readonly) return;
    if (iso && this.isIsoDisabled(iso)) return;
    this.value = iso;
    this.syncCalendarFromValue(iso);
    this.formCtrl.setValue(iso, { markDirty: true });
    this.formCtrl.markTouched();
    this.emitEvent('mth-change', { detail: { value: iso } });
  }

  private readonly handleInputChange = (): void => {
    const next = this.inputEl?.value.trim() ?? '';
    if (!next) {
      this.commitDate('');
      return;
    }
    if (parseIsoDate(next)) {
      this.commitDate(next);
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
    const isRtl = this.resolvedDir === 'rtl';
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
      const focused = this.calendar.focusedDate;
      const iso = formatIsoDate(focused);
      if (!this.isIsoDisabled(iso)) {
        this.calendar.selectDate(focused);
        this.commitDate(iso);
        void this.hide('programmatic');
      }
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

  private readonly handleDayClick = (date: CalendarDate, iso: string): void => {
    if (this.isIsoDisabled(iso)) return;
    this.calendar.setFocusedDate(date);
    this.calendar.selectDate(date);
    this.commitDate(iso);
    void this.hide('programmatic');
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
    const focusedIso = formatIsoDate(this.calendar.focusedDate);

    return html`
      <div part="base">
        ${this.label
          ? html`<label part="label" for="mth-dp-input">${this.label}</label>`
          : nothing}
        <div part="control">
          <input
            id="mth-dp-input"
            part="input"
            type="text"
            .value=${this.value}
            placeholder=${this.placeholder}
            aria-label=${this.label || this.t('chooseDate')}
            ?disabled=${isDisabled}
            ?readonly=${this.readonly}
            ?required=${this.required}
            @change=${this.handleInputChange}
          />
          <button
            part="trigger"
            type="button"
            aria-label=${this.t('chooseDate')}
            aria-expanded=${this.open ? 'true' : 'false'}
            aria-haspopup="dialog"
            aria-controls="mth-dp-popover"
            ?disabled=${isDisabled || this.readonly}
            @click=${this.handleTriggerClick}
          >
            &#128197;
          </button>
        </div>
        <div
          id="mth-dp-popover"
          part="popover"
          role="dialog"
          aria-label=${this.t('calendarLabel')}
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
                    const cellDisabled = cell.isDisabled || this.isIsoDisabled(cell.iso);
                    const isSelected = cell.iso === this.value || cell.isSelected;
                    return html`
                      <button
                        part="day"
                        type="button"
                        role="gridcell"
                        data-iso=${cell.iso}
                        data-outside=${cell.inMonth ? 'false' : 'true'}
                        data-today=${cell.isToday ? 'true' : 'false'}
                        tabindex=${cell.iso === focusedIso ? '0' : '-1'}
                        aria-selected=${isSelected ? 'true' : 'false'}
                        ?disabled=${cellDisabled}
                        @click=${() => this.handleDayClick(cell.date, cell.iso)}
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
