import { UIElement, type PropertyValues } from '@methane-ui/core';
import {
  CalendarCore,
  FormattingUtils,
  RovingFocusController,
  formatIsoDate,
  type CalendarCell,
  type CalendarDate,
} from '@methane-ui/primitives';
import { html } from 'lit';
import { property } from 'lit/decorators.js';
import { resolveEffectiveDir, stopRovingKeys } from '../shared/style-sheet.js';
import { eventCalendarMessages } from './event-calendar.messages.js';
import { eventCalendarStyles } from './event-calendar.styles.js';

export type CalendarViewMode = 'month' | 'week' | 'day';

export interface CalendarEvent {
  readonly id: string;
  readonly title: string;
  readonly date: string;
  readonly startTime?: string;
  readonly endTime?: string;
}

function parseIso(iso: string): CalendarDate | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso.trim());
  if (!m) return null;
  return {
    year: Number(m[1]),
    month: Number(m[2]),
    day: Number(m[3]),
  };
}

const DAY_HOURS = ['09:00', '10:00', '11:00', '13:00', '14:00', '15:00', '16:00'] as const;

/**
 * `<mth-event-calendar>`: Month, week, and day schedule view powered by CalendarCore
 * with RTL-aware 2D RovingFocusController and localized headers.
 */
export class MthEventCalendar extends UIElement {
  static override shadowRootOptions = {
    ...UIElement.shadowRootOptions,
    delegatesFocus: true,
  };
  static override messages = eventCalendarMessages;
  static override styles = eventCalendarStyles;

  @property({ attribute: false })
  events: ReadonlyArray<CalendarEvent> = [];

  @property({ type: String, reflect: true })
  view: CalendarViewMode = 'month';

  @property({ type: String, attribute: 'active-date' })
  activeDate = '';

  private readonly calendar: CalendarCore;
  private readonly rovingFocus: RovingFocusController;

  constructor() {
    super();
    this.calendar = new CalendarCore(
      {
        locale: 'en-US',
        initialFocusDate: { year: 2026, month: 11, day: 15 },
      },
      this,
    );
    this.rovingFocus = new RovingFocusController(this, {
      getItems: () => this._getDayTriggers(),
      orientation: 'both',
      columns: 7,
      loop: true,
      dir: 'auto',
    });
  }

  protected override willUpdate(changed: PropertyValues): void {
    super.willUpdate(changed);
    this.calendar.setLocale(this.resolvedLocale);
    if (changed.has('activeDate') && this.activeDate) {
      const parsed = parseIso(this.activeDate);
      if (parsed) {
        this.calendar.setFocusedDate(parsed);
      }
    }
    this.rovingFocus.updateOptions({
      columns: this.view === 'day' ? 1 : 7,
      dir: resolveEffectiveDir(this, this.resolvedDir),
    });
  }

  stepPeriod(delta: -1 | 1): void {
    const next =
      this.view === 'month'
        ? this.calendar.navigateByMonths(delta)
        : this.calendar.navigateByDays(delta * (this.view === 'week' ? 7 : 1));
    this.activeDate = formatIsoDate(next);
    this.emitEvent('mth-date-change', {
      detail: { activeDate: this.activeDate, view: this.view },
    });
  }

  private _getDayTriggers(): HTMLElement[] {
    if (!this.shadowRoot) return [];
    return Array.from(this.shadowRoot.querySelectorAll<HTMLElement>('.day-trigger'));
  }

  private _visibleCells(): ReadonlyArray<CalendarCell> {
    const focused = this.calendar.focusedDate;
    const grid = this.calendar.getMonthGrid(focused.year, focused.month);
    if (this.view === 'month') {
      return grid.flat();
    }
    const focusedIso = formatIsoDate(focused);
    const matchingWeek = grid.find((week) => week.some((c) => c.iso === focusedIso)) ?? grid[0] ?? [];
    if (this.view === 'week') {
      return matchingWeek;
    }
    const dayCell = matchingWeek.find((c) => c.iso === focusedIso) ?? matchingWeek[0];
    return dayCell ? [dayCell] : [];
  }

  private _periodHeading(): string {
    const f = this.calendar.focusedDate;
    const utcDate = new Date(Date.UTC(f.year, f.month - 1, f.day));
    return FormattingUtils.formatDate(utcDate, this.resolvedLocale, {
      month: 'long',
      year: 'numeric',
      timeZone: 'UTC',
    });
  }

  override render() {
    const weekdays = this.calendar.getWeekdayHeaders('short');
    const cells = this._visibleCells();
    const focusedIso = formatIsoDate(this.calendar.focusedDate);
    const activeIndex = this.rovingFocus.currentIndex >= 0 ? this.rovingFocus.currentIndex : 0;

    return html`
      <div
        part="base"
        class="base"
        role="region"
        aria-label=${this.t('calendarLabel')}
        dir=${resolveEffectiveDir(this, this.resolvedDir)}
      >
        <div part="header" class="header" @keydown=${stopRovingKeys}>
          <div class="nav-group">
            <button
              type="button"
              class="btn"
              @click=${() => this.stepPeriod(-1)}
            >
              ${this.t('prevPeriod')}
            </button>
            <h3 class="period-title">${this._periodHeading()}</h3>
            <button
              type="button"
              class="btn"
              @click=${() => this.stepPeriod(1)}
            >
              ${this.t('nextPeriod')}
            </button>
          </div>

          <div class="view-group">
            <slot></slot>
            ${(['month', 'week', 'day'] as const).map((mode) => {
              const labelKey =
                mode === 'month' ? 'viewMonth' : mode === 'week' ? 'viewWeek' : 'viewDay';
              return html`
                <button
                  type="button"
                  class="btn"
                  aria-pressed=${this.view === mode ? 'true' : 'false'}
                  @click=${() => {
                    this.view = mode;
                    this.emitEvent('mth-date-change', {
                      detail: { activeDate: focusedIso, view: mode },
                    });
                  }}
                >
                  ${this.t(labelKey)}
                </button>
              `;
            })}
          </div>
        </div>

        <div class="weekdays" ?hidden=${this.view === 'day'}>
          ${weekdays.map((day) => html`<span>${day}</span>`)}
        </div>

        <div part="grid" class="grid" data-view=${this.view}>
          ${this.view === 'day'
            ? html`
                <div class="day-agenda">
                  ${DAY_HOURS.map((hour, idx) => {
                    const slotEvents = this.events.filter(
                      (ev) => ev.date === focusedIso && ev.startTime === hour,
                    );
                    return html`
                      <div class="hour-slot">
                        <span>${hour}</span>
                        <div>
                          ${slotEvents.map(
                            (ev) => html`
                              <button
                                type="button"
                                part="event-chip"
                                class="event-chip"
                                @click=${() =>
                                  this.emitEvent('mth-event-select', { detail: { event: ev } })}
                              >
                                ${ev.title}
                              </button>
                            `,
                          )}
                        </div>
                        <button
                          type="button"
                          class="add-btn day-trigger"
                          tabindex=${activeIndex === idx ? '0' : '-1'}
                          aria-label="${this.t('createEvent')} ${focusedIso} ${hour}"
                          @click=${() =>
                            this.emitEvent('mth-event-create', {
                              detail: { date: focusedIso, time: hour },
                            })}
                        >
                          +
                        </button>
                      </div>
                    `;
                  })}
                </div>
              `
            : cells.map((cell, idx) => {
                const dayEvents = this.events.filter((ev) => ev.date === cell.iso);
                return html`
                  <div
                    part="day-cell"
                    class="day-cell"
                    data-date=${cell.iso}
                    data-outside=${cell.inMonth ? 'false' : 'true'}
                  >
                    <div class="day-top">
                      <button
                        type="button"
                        class="day-trigger"
                        tabindex=${activeIndex === idx ? '0' : '-1'}
                        aria-label=${cell.iso}
                        @click=${() => {
                          this.calendar.setFocusedDate(cell.date);
                          this.activeDate = cell.iso;
                          this.emitEvent('mth-date-change', {
                            detail: { activeDate: cell.iso, view: this.view },
                          });
                        }}
                      >
                        ${cell.date.day}
                      </button>
                      <button
                        type="button"
                        class="add-btn"
                        tabindex="-1"
                        aria-label="${this.t('createEvent')} ${cell.iso}"
                        @click=${() =>
                          this.emitEvent('mth-event-create', { detail: { date: cell.iso } })}
                      >
                        +
                      </button>
                    </div>
                    ${dayEvents.map(
                      (ev) => html`
                        <button
                          type="button"
                          part="event-chip"
                          class="event-chip"
                          tabindex="-1"
                          @click=${() =>
                            this.emitEvent('mth-event-select', { detail: { event: ev } })}
                        >
                          <span>${ev.startTime ? `${ev.startTime} ` : ''}${ev.title}</span>
                        </button>
                      `,
                    )}
                  </div>
                `;
              })}
        </div>
      </div>
    `;
  }
}
