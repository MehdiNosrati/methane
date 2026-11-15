import { UIElement, type PropertyValues } from '@methane/core';
import {
  CalendarCore,
  FormattingUtils,
  addCalendarMonths,
  compareCalendarDates,
  formatIsoDate,
  getFirstDayOfWeek,
  getTodayCalendarDate,
  type CalendarDate,
} from '@methane/primitives';
import { html, nothing } from 'lit';
import { property, state } from 'lit/decorators.js';
import { dateRangeCalendarMessages } from './date-range-calendar.messages.js';
import { dateRangeCalendarStyles } from './date-range-calendar.styles.js';

function parseIsoDate(iso: string | undefined): CalendarDate | undefined {
  if (!iso) return undefined;
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso.trim());
  if (!match) return undefined;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (month < 1 || month > 12 || day < 1 || day > 31) return undefined;
  return { year, month, day };
}

/**
 * `<mth-date-range-calendar>`: Multi-month date-range calendar backed by
 * `CalendarCore` (`mode: 'range'`) and `FormattingUtils`.
 */
export class MthDateRangeCalendar extends UIElement {
  static override shadowRootOptions = { ...UIElement.shadowRootOptions, delegatesFocus: true };
  static override messages = dateRangeCalendarMessages;
  static override styles = dateRangeCalendarStyles;

  @property({ type: String, reflect: true })
  start = '';

  @property({ type: String, reflect: true })
  end = '';

  @property({ type: String })
  min = '';

  @property({ type: String })
  max = '';

  @property({ type: Number })
  months = 2;

  @property({ type: String })
  locale = '';

  @property({ type: Boolean, reflect: true })
  disabled = false;

  @property({ type: Boolean, reflect: true })
  readonly = false;

  @property({ attribute: false })
  isDateDisabled?: (iso: string) => boolean;

  @state()
  private baseYear = getTodayCalendarDate().year;

  @state()
  private baseMonth = getTodayCalendarDate().month;

  @state()
  private hoveredIso = '';

  @state()
  private statusAnnouncement = '';

  private core: CalendarCore;
  private focusAnchorDate: CalendarDate = getTodayCalendarDate();

  constructor() {
    super();
    this.core = this.createCore(this.focusAnchorDate);
  }

  private get effectiveLocale(): string {
    return this.locale || this.lang || 'en';
  }

  private createCore(initialFocusDate: CalendarDate): CalendarCore {
    const predicate = this.isDateDisabled;
    const minDate = parseIsoDate(this.min);
    const maxDate = parseIsoDate(this.max);
    const core = new CalendarCore(
      {
        locale: this.effectiveLocale,
        mode: 'range',
        ...(minDate ? { min: minDate } : {}),
        ...(maxDate ? { max: maxDate } : {}),
        ...(predicate ? { isDateDisabled: (date: CalendarDate) => predicate(formatIsoDate(date)) } : {}),
        initialFocusDate,
      },
      null,
    );
    const s = parseIsoDate(this.start);
    const e = parseIsoDate(this.end);
    if (s) {
      core.selectDate(s);
    }
    if (e) {
      core.selectDate(e);
    }
    return core;
  }

  private rebuildCore(): void {
    this.core = this.createCore(this.focusAnchorDate);
    this.focusAnchorDate = this.core.focusedDate;
  }

  protected override willUpdate(changed: PropertyValues): void {
    super.willUpdate(changed);
    if (
      changed.has('min') ||
      changed.has('max') ||
      changed.has('locale') ||
      changed.has('lang') ||
      changed.has('isDateDisabled')
    ) {
      this.rebuildCore();
    }
    if (changed.has('start') || changed.has('end')) {
      const s = parseIsoDate(this.start);
      if (s && changed.has('start')) {
        this.focusAnchorDate = s;
        this.baseYear = s.year;
        this.baseMonth = s.month;
      }
      this.rebuildCore();
    }
    if (changed.has('disabled')) {
      this.setCustomState('disabled', this.disabled);
    }
    if (changed.has('readonly')) {
      this.setCustomState('readonly', this.readonly);
    }
  }

  private isRtlDirection(): boolean {
    if (this.dir === 'rtl' || this.getAttribute('dir') === 'rtl') {
      return true;
    }
    if (this.dir === 'ltr' || this.getAttribute('dir') === 'ltr') {
      return false;
    }
    return this.closest('[dir]')?.getAttribute('dir') === 'rtl';
  }

  private formatMonthYear(year: number, month: number): string {
    return FormattingUtils.formatDate(
      new Date(Date.UTC(year, month - 1, 15)),
      this.effectiveLocale,
      { month: 'long', year: 'numeric', timeZone: 'UTC' },
    );
  }

  private formatFullDate(date: CalendarDate): string {
    return FormattingUtils.formatDate(
      new Date(Date.UTC(date.year, date.month - 1, date.day)),
      this.effectiveLocale,
      { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' },
    );
  }

  private syncViewportToFocus(announceMonth: boolean): void {
    const focused = this.core.focusedDate;
    this.focusAnchorDate = focused;
    const count = Math.max(1, Math.min(2, Math.floor(this.months || 1)));
    const firstMonthKey = this.baseYear * 12 + (this.baseMonth - 1);
    const lastMonthKey = firstMonthKey + count - 1;
    const focusedMonthKey = focused.year * 12 + (focused.month - 1);

    if (focusedMonthKey < firstMonthKey || focusedMonthKey > lastMonthKey) {
      this.baseYear = focused.year;
      this.baseMonth = focused.month;
      if (announceMonth) {
        this.statusAnnouncement = this.t('monthChanged', {
          month: this.formatMonthYear(focused.year, focused.month),
        });
      }
    }
  }

  private async focusDayButton(iso: string): Promise<void> {
    await this.updateComplete;
    const btn = this.shadowRoot?.querySelector<HTMLButtonElement>(
      `button[data-iso="${iso}"][data-outside="false"]`,
    ) ?? this.shadowRoot?.querySelector<HTMLButtonElement>(`button[data-iso="${iso}"]`);
    btn?.focus();
  }

  navigateMonth(delta: number): void {
    if (this.disabled) return;
    const nextBase = addCalendarMonths({ year: this.baseYear, month: this.baseMonth, day: 1 }, delta);
    this.baseYear = nextBase.year;
    this.baseMonth = nextBase.month;
    this.core.navigateByMonths(delta);
    this.focusAnchorDate = this.core.focusedDate;
    this.statusAnnouncement = this.t('monthChanged', {
      month: this.formatMonthYear(this.baseYear, this.baseMonth),
    });
    this.requestUpdate();
  }

  selectDate(date: CalendarDate): boolean {
    if (this.disabled || this.readonly || this.core.isDisabled(date)) {
      return false;
    }

    this.core.selectDate(date);
    this.focusAnchorDate = date;
    const nextStart = this.core.rangeStart ? formatIsoDate(this.core.rangeStart) : '';
    const nextEnd = this.core.rangeEnd ? formatIsoDate(this.core.rangeEnd) : '';
    this.start = nextStart;
    this.end = nextEnd;

    if (nextStart && !nextEnd) {
      this.statusAnnouncement = this.t('rangeStartSelected', {
        date: this.formatFullDate(date),
      });
    } else if (nextStart && nextEnd) {
      this.statusAnnouncement = this.t('rangeSelected', {
        start: this.formatFullDate(this.core.rangeStart!),
        end: this.formatFullDate(this.core.rangeEnd!),
      });
    }

    this.dispatchEvent(
      new CustomEvent('mth-change', {
        bubbles: true,
        composed: true,
        detail: { start: nextStart, end: nextEnd },
      }),
    );
    this.requestUpdate();
    return true;
  }

  private handleDayKeyDown(event: KeyboardEvent, date: CalendarDate): void {
    if (this.disabled) return;
    const rtl = this.isRtlDirection();
    let handled = true;

    switch (event.key) {
      case 'ArrowRight':
        this.core.navigateByDays(rtl ? -1 : 1);
        this.syncViewportToFocus(true);
        break;
      case 'ArrowLeft':
        this.core.navigateByDays(rtl ? 1 : -1);
        this.syncViewportToFocus(true);
        break;
      case 'ArrowDown':
        this.core.navigateByDays(7);
        this.syncViewportToFocus(true);
        break;
      case 'ArrowUp':
        this.core.navigateByDays(-7);
        this.syncViewportToFocus(true);
        break;
      case 'Home': {
        const firstDay = getFirstDayOfWeek(this.effectiveLocale);
        const dayIndex = new Date(Date.UTC(date.year, date.month - 1, date.day)).getUTCDay();
        this.core.navigateByDays(-((dayIndex - firstDay + 7) % 7));
        this.syncViewportToFocus(true);
        break;
      }
      case 'End': {
        const firstDay = getFirstDayOfWeek(this.effectiveLocale);
        const dayIndex = new Date(Date.UTC(date.year, date.month - 1, date.day)).getUTCDay();
        const offset = (dayIndex - firstDay + 7) % 7;
        this.core.navigateByDays(6 - offset);
        this.syncViewportToFocus(true);
        break;
      }
      case 'PageUp':
        this.navigateMonth(event.shiftKey ? -12 : -1);
        break;
      case 'PageDown':
        this.navigateMonth(event.shiftKey ? 12 : 1);
        break;
      case 'Enter':
      case ' ':
        this.selectDate(date);
        break;
      default:
        handled = false;
        break;
    }

    if (handled) {
      event.preventDefault();
      this.requestUpdate();
      void this.focusDayButton(formatIsoDate(this.core.focusedDate));
    }
  }

  private isPreviewInRange(date: CalendarDate): boolean {
    if (!this.core.rangeStart || this.core.rangeEnd || !this.hoveredIso) {
      return false;
    }
    const hover = parseIsoDate(this.hoveredIso);
    if (!hover) return false;
    const minD = compareCalendarDates(this.core.rangeStart, hover) <= 0 ? this.core.rangeStart : hover;
    const maxD = compareCalendarDates(this.core.rangeStart, hover) <= 0 ? hover : this.core.rangeStart;
    return compareCalendarDates(date, minD) >= 0 && compareCalendarDates(date, maxD) <= 0;
  }

  override render() {
    const count = Math.max(1, Math.min(2, Math.floor(this.months || 1)));
    const monthDates = Array.from({ length: count }, (_, idx) =>
      addCalendarMonths({ year: this.baseYear, month: this.baseMonth, day: 1 }, idx),
    );
    const shortWeekdays = this.core.getWeekdayHeaders('short');
    const longWeekdays = this.core.getWeekdayHeaders('long');
    const focusedIso = formatIsoDate(this.core.focusedDate);
    const monthGrids = monthDates.map((m) => this.core.getMonthGrid(m.year, m.month));
    const hasFocusedInView = monthGrids.some((weeks) =>
      weeks.some((week) => week.some((c) => c.inMonth && c.iso === focusedIso && !c.isDisabled)),
    );
    const fallbackIso =
      monthGrids
        .flat()
        .flat()
        .find((c) => c.inMonth && !c.isDisabled)?.iso ?? focusedIso;
    const tabTargetIso = hasFocusedInView ? focusedIso : fallbackIso;

    return html`
      <div
        part="base"
        class="base"
        role="region"
        aria-label=${this.t('regionLabel')}
        @mouseleave=${() => {
          this.hoveredIso = '';
        }}
      >
        <div part="header" class="header">
          <div class="nav-group">
            <button
              type="button"
              part="nav-button"
              class="nav-btn"
              aria-label=${this.t('previousYear')}
              ?disabled=${this.disabled}
              @click=${() => this.navigateMonth(-12)}
            >
              «
            </button>
            <button
              type="button"
              part="nav-button"
              class="nav-btn"
              aria-label=${this.t('previousMonth')}
              ?disabled=${this.disabled}
              @click=${() => this.navigateMonth(-1)}
            >
              ‹
            </button>
          </div>

          <slot name="header"></slot>

          <div class="nav-group">
            <button
              type="button"
              part="nav-button"
              class="nav-btn"
              aria-label=${this.t('nextMonth')}
              ?disabled=${this.disabled}
              @click=${() => this.navigateMonth(1)}
            >
              ›
            </button>
            <button
              type="button"
              part="nav-button"
              class="nav-btn"
              aria-label=${this.t('nextYear')}
              ?disabled=${this.disabled}
              @click=${() => this.navigateMonth(12)}
            >
              »
            </button>
          </div>
        </div>

        <div part="months" class="months">
          ${monthDates.map((m, mIdx) => {
            const headingId = `mth-range-heading-${mIdx}`;
            const weeks = monthGrids[mIdx] ?? [];
            return html`
              <section part="month" class="month">
                <h2 id=${headingId} part="heading" class="heading">
                  ${this.formatMonthYear(m.year, m.month)}
                </h2>
                <table part="grid" class="grid" role="grid" aria-labelledby=${headingId}>
                  <thead>
                    <tr>
                      ${shortWeekdays.map(
                        (day, dIdx) => html`
                          <th scope="col" part="weekday" class="weekday" abbr=${longWeekdays[dIdx] ?? day}>
                            ${day}
                          </th>
                        `,
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    ${weeks.map(
                      (week) => html`
                        <tr>
                          ${week.map((cell) => {
                            const cellDisabled = this.disabled || cell.isDisabled;
                            const inRange = cell.inMonth && (cell.isInRange || this.isPreviewInRange(cell.date));
                            const isStart = cell.inMonth && cell.isRangeStart;
                            const isEnd = cell.inMonth && cell.isRangeEnd;
                            const isTabTarget = cell.inMonth && cell.iso === tabTargetIso && !this.disabled;
                            return html`
                              <td
                                part="cell"
                                class="cell"
                                role="gridcell"
                                aria-selected=${cell.isSelected ? 'true' : 'false'}
                              >
                                <button
                                  type="button"
                                  part="day"
                                  class="day"
                                  data-iso=${cell.iso}
                                  data-outside=${cell.inMonth ? 'false' : 'true'}
                                  data-today=${cell.isToday ? 'true' : 'false'}
                                  data-range-start=${isStart ? 'true' : 'false'}
                                  data-range-end=${isEnd ? 'true' : 'false'}
                                  data-in-range=${inRange ? 'true' : 'false'}
                                  tabindex=${isTabTarget ? 0 : -1}
                                  aria-label=${this.formatFullDate(cell.date)}
                                  aria-current=${cell.isToday ? 'date' : nothing}
                                  aria-disabled=${cellDisabled ? 'true' : 'false'}
                                  @mouseenter=${() => {
                                    if (!cellDisabled) {
                                      this.hoveredIso = cell.iso;
                                    }
                                  }}
                                  @click=${() => {
                                    if (!cellDisabled) {
                                      this.core.setFocusedDate(cell.date);
                                      this.selectDate(cell.date);
                                    }
                                  }}
                                  @keydown=${(e: KeyboardEvent) => this.handleDayKeyDown(e, cell.date)}
                                >
                                  ${cell.date.day}
                                </button>
                              </td>
                            `;
                          })}
                        </tr>
                      `,
                    )}
                  </tbody>
                </table>
              </section>
            `;
          })}
        </div>

        <slot name="footer"></slot>

        <div part="status" class="sr-only" role="status" aria-live="polite">
          ${this.statusAnnouncement}
        </div>
      </div>
    `;
  }
}
