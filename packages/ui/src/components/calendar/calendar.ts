import { UIElement, inferDirectionFromLocale, type PropertyValues } from '@methane/core';
import {
  CalendarCore,
  FormattingUtils,
  formatIsoDate,
  getFirstDayOfWeek,
  getTodayCalendarDate,
  type CalendarDate,
} from '@methane/primitives';
import { html, nothing } from 'lit';
import { property, state } from 'lit/decorators.js';
import { calendarMessages } from './calendar.messages.js';
import { calendarStyles } from './calendar.styles.js';

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
 * `<mth-calendar>`: Single-date calendar grid backed by `CalendarCore` and
 * `FormattingUtils` with RTL-aware 2D WAI-ARIA keyboard navigation.
 */
export class MthCalendar extends UIElement {
  static override shadowRootOptions = { ...UIElement.shadowRootOptions, delegatesFocus: true };
  static override messages = calendarMessages;
  static override styles = calendarStyles;

  @property({ type: String, reflect: true })
  value = '';

  @property({ type: String })
  min = '';

  @property({ type: String })
  max = '';

  @property({ type: String })
  locale = '';

  @property({ type: Boolean, reflect: true })
  disabled = false;

  @property({ type: Boolean, reflect: true })
  readonly = false;

  @property({ attribute: false })
  isDateDisabled?: (iso: string) => boolean;

  @state()
  private viewYear = getTodayCalendarDate().year;

  @state()
  private viewMonth = getTodayCalendarDate().month;

  @state()
  private statusAnnouncement = '';

  private core: CalendarCore;
  private focusAnchorDate: CalendarDate = getTodayCalendarDate();

  constructor() {
    super();
    this.core = this.createCore(this.focusAnchorDate);
  }

  private get effectiveLocale(): string {
    return this.locale || this.resolvedLocale;
  }

  private createCore(initialFocusDate: CalendarDate): CalendarCore {
    const predicate = this.isDateDisabled;
    const minDate = parseIsoDate(this.min);
    const maxDate = parseIsoDate(this.max);
    const core = new CalendarCore(
      {
        locale: this.effectiveLocale,
        mode: 'single',
        ...(minDate ? { min: minDate } : {}),
        ...(maxDate ? { max: maxDate } : {}),
        ...(predicate ? { isDateDisabled: (date: CalendarDate) => predicate(formatIsoDate(date)) } : {}),
        initialFocusDate,
      },
      null,
    );
    const selected = parseIsoDate(this.value);
    if (selected) {
      core.selectDate(selected);
    }
    return core;
  }

  private rebuildCore(preserveFocus = true): void {
    const currentFocus = preserveFocus ? this.focusAnchorDate : (parseIsoDate(this.value) ?? getTodayCalendarDate());
    this.core = this.createCore(currentFocus);
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
      this.rebuildCore(true);
    } else {
      this.core.setLocale(this.effectiveLocale);
    }
    if (changed.has('value')) {
      const parsed = parseIsoDate(this.value);
      if (parsed) {
        this.focusAnchorDate = parsed;
        this.viewYear = parsed.year;
        this.viewMonth = parsed.month;
        this.rebuildCore(true);
      } else {
        this.rebuildCore(true);
      }
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
    const ancestorDir = this.closest('[dir]')?.getAttribute('dir');
    if (ancestorDir === 'rtl') return true;
    if (ancestorDir === 'ltr') return false;
    if (this.locale) {
      return inferDirectionFromLocale(this.locale) === 'rtl';
    }
    return this.resolvedDir === 'rtl';
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

  private syncViewToFocus(announceMonth: boolean): void {
    const focused = this.core.focusedDate;
    this.focusAnchorDate = focused;
    const monthChanged = focused.year !== this.viewYear || focused.month !== this.viewMonth;
    this.viewYear = focused.year;
    this.viewMonth = focused.month;
    if (monthChanged && announceMonth) {
      this.statusAnnouncement = this.t('monthChanged', {
        month: this.formatMonthYear(focused.year, focused.month),
      });
    }
    this.emitEvent('mth-focus-date', {
      detail: { value: formatIsoDate(focused) },
    });
  }

  private async focusDayButton(iso: string): Promise<void> {
    await this.updateComplete;
    const btn = this.shadowRoot?.querySelector<HTMLButtonElement>(`button[data-iso="${iso}"]`);
    btn?.focus();
  }

  navigateMonth(delta: number): void {
    if (this.disabled) return;
    this.core.navigateByMonths(delta);
    this.syncViewToFocus(true);
    this.requestUpdate();
  }

  selectDate(date: CalendarDate): boolean {
    if (this.disabled || this.readonly || this.core.isDisabled(date)) {
      return false;
    }
    this.core.selectDate(date);
    this.focusAnchorDate = date;
    this.viewYear = date.year;
    this.viewMonth = date.month;
    const iso = formatIsoDate(date);
    this.value = iso;
    this.statusAnnouncement = this.t('dateSelected', {
      date: this.formatFullDate(date),
    });
    this.emitEvent('mth-change', {
      detail: { value: iso },
    });
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
        this.syncViewToFocus(true);
        break;
      case 'ArrowLeft':
        this.core.navigateByDays(rtl ? 1 : -1);
        this.syncViewToFocus(true);
        break;
      case 'ArrowDown':
        this.core.navigateByDays(7);
        this.syncViewToFocus(true);
        break;
      case 'ArrowUp':
        this.core.navigateByDays(-7);
        this.syncViewToFocus(true);
        break;
      case 'Home': {
        const firstDay = getFirstDayOfWeek(this.effectiveLocale);
        const dayIndex = new Date(Date.UTC(date.year, date.month - 1, date.day)).getUTCDay();
        const delta = -((dayIndex - firstDay + 7) % 7);
        this.core.navigateByDays(delta);
        this.syncViewToFocus(true);
        break;
      }
      case 'End': {
        const firstDay = getFirstDayOfWeek(this.effectiveLocale);
        const dayIndex = new Date(Date.UTC(date.year, date.month - 1, date.day)).getUTCDay();
        const offset = (dayIndex - firstDay + 7) % 7;
        this.core.navigateByDays(6 - offset);
        this.syncViewToFocus(true);
        break;
      }
      case 'PageUp':
        this.core.navigateByMonths(event.shiftKey ? -12 : -1);
        this.syncViewToFocus(true);
        break;
      case 'PageDown':
        this.core.navigateByMonths(event.shiftKey ? 12 : 1);
        this.syncViewToFocus(true);
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

  override render() {
    const headingId = 'mth-calendar-heading';
    const shortWeekdays = this.core.getWeekdayHeaders('short');
    const longWeekdays = this.core.getWeekdayHeaders('long');
    const weeks = this.core.getMonthGrid(this.viewYear, this.viewMonth);
    const focusedIso = formatIsoDate(this.core.focusedDate);
    const hasFocusedInGrid = weeks.some((week) => week.some((cell) => cell.iso === focusedIso && !cell.isDisabled));
    const fallbackFocusIso =
      weeks.flat().find((cell) => cell.inMonth && !cell.isDisabled)?.iso ??
      weeks.flat().find((cell) => !cell.isDisabled)?.iso ??
      focusedIso;
    const tabTargetIso = hasFocusedInGrid ? focusedIso : fallbackFocusIso;

    return html`
      <div part="base" class="base" role="region" aria-label=${this.t('regionLabel')}>
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

          <h2 id=${headingId} part="heading" class="heading" aria-live="polite">
            ${this.formatMonthYear(this.viewYear, this.viewMonth)}
          </h2>

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

        <slot name="header"></slot>

        <table part="grid" class="grid" role="grid" aria-labelledby=${headingId}>
          <thead>
            <tr>
              ${shortWeekdays.map(
                (day, idx) => html`
                  <th scope="col" part="weekday" class="weekday" abbr=${longWeekdays[idx] ?? day}>
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
                    const tabIndex = cell.iso === tabTargetIso && !this.disabled ? 0 : -1;
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
                          data-selected=${cell.isSelected ? 'true' : 'false'}
                          tabindex=${tabIndex}
                          aria-label=${this.formatFullDate(cell.date)}
                          aria-current=${cell.isToday ? 'date' : nothing}
                          aria-disabled=${cellDisabled ? 'true' : 'false'}
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

        <slot name="footer"></slot>

        <div part="status" class="sr-only" role="status" aria-live="polite">
          ${this.statusAnnouncement}
        </div>
      </div>
    `;
  }
}
