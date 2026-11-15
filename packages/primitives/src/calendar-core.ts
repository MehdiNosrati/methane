import type { ReactiveController, ReactiveControllerHost } from 'lit';

export interface CalendarDate {
  readonly year: number;
  readonly month: number; // 1-12
  readonly day: number; // 1-31
}

export interface CalendarCell {
  readonly date: CalendarDate;
  readonly iso: string;
  readonly inMonth: boolean;
  readonly isToday: boolean;
  readonly isDisabled: boolean;
  readonly isSelected: boolean;
  readonly isRangeStart: boolean;
  readonly isRangeEnd: boolean;
  readonly isInRange: boolean;
}

export interface CalendarCoreOptions {
  locale?: string;
  mode?: 'single' | 'range';
  min?: CalendarDate;
  max?: CalendarDate;
  isDateDisabled?: (date: CalendarDate) => boolean;
  initialFocusDate?: CalendarDate;
}

const SUNDAY_START_TERRITORIES = /* @__PURE__ */ new Set([
  'AG', 'AS', 'AU', 'BD', 'BR', 'BS', 'BT', 'BW', 'BZ', 'CA', 'CO', 'DM', 'DO', 'ET',
  'GT', 'GU', 'HK', 'HN', 'ID', 'IL', 'IN', 'JM', 'JP', 'KE', 'KH', 'KR', 'LA', 'MH',
  'MM', 'MO', 'MT', 'MX', 'MZ', 'NI', 'NP', 'PA', 'PE', 'PH', 'PK', 'PR', 'PT', 'PY',
  'SA', 'SG', 'SV', 'TH', 'TT', 'TW', 'UM', 'US', 'VE', 'VI', 'WS', 'YE', 'ZA', 'ZW',
]);

/**
 * Locale-aware headless calendar engine supporting Temporal API detection with UTC Date fallback,
 * single/range selection, disabled predicates, week-start resolution, and RFC 5545 RRULE expansion.
 */
export class CalendarCore implements ReactiveController {
  private readonly host: ReactiveControllerHost | null;
  private locale: string;
  private mode: 'single' | 'range';
  private minDate: CalendarDate | undefined;
  private maxDate: CalendarDate | undefined;
  private disabledPredicate: ((date: CalendarDate) => boolean) | undefined;

  private _focusedDate: CalendarDate;
  private _selectedDate: CalendarDate | null = null;
  private _rangeStart: CalendarDate | null = null;
  private _rangeEnd: CalendarDate | null = null;

  constructor(options: CalendarCoreOptions = {}, host: ReactiveControllerHost | null = null) {
    this.host = host;
    this.locale = options.locale ?? 'en-US';
    this.mode = options.mode ?? 'single';
    this.minDate = options.min;
    this.maxDate = options.max;
    this.disabledPredicate = options.isDateDisabled;
    this._focusedDate = options.initialFocusDate ?? getTodayCalendarDate();
    this.host?.addController(this);
  }

  get focusedDate(): CalendarDate {
    return this._focusedDate;
  }

  get selectedDate(): CalendarDate | null {
    return this._selectedDate;
  }

  get rangeStart(): CalendarDate | null {
    return this._rangeStart;
  }

  get rangeEnd(): CalendarDate | null {
    return this._rangeEnd;
  }

  get usesTemporal(): boolean {
    const g = globalThis as { Temporal?: { PlainDate?: unknown } };
    return Boolean(g.Temporal?.PlainDate);
  }

  hostConnected(): void {
    // Lifecycle managed via reactive updates.
  }

  hostDisconnected(): void {
    // No external listeners.
  }

  setLocale(locale: string): void {
    this.locale = locale;
    this.host?.requestUpdate();
  }

  setFocusedDate(date: CalendarDate): void {
    this._focusedDate = clampCalendarDate(date, this.minDate, this.maxDate);
    this.host?.requestUpdate();
  }

  navigateByDays(deltaDays: number): CalendarDate {
    const next = addCalendarDays(this._focusedDate, deltaDays);
    this.setFocusedDate(next);
    return this._focusedDate;
  }

  navigateByMonths(deltaMonths: number): CalendarDate {
    const next = addCalendarMonths(this._focusedDate, deltaMonths);
    this.setFocusedDate(next);
    return this._focusedDate;
  }

  isDisabled(date: CalendarDate): boolean {
    if (this.minDate && compareCalendarDates(date, this.minDate) < 0) return true;
    if (this.maxDate && compareCalendarDates(date, this.maxDate) > 0) return true;
    return Boolean(this.disabledPredicate?.(date));
  }

  selectDate(date: CalendarDate): void {
    if (this.isDisabled(date)) return;
    this._focusedDate = date;

    if (this.mode === 'single') {
      this._selectedDate = date;
      this.host?.requestUpdate();
      return;
    }

    if (!this._rangeStart || (this._rangeStart && this._rangeEnd)) {
      this._rangeStart = date;
      this._rangeEnd = null;
    } else if (compareCalendarDates(date, this._rangeStart) < 0) {
      this._rangeEnd = this._rangeStart;
      this._rangeStart = date;
    } else {
      this._rangeEnd = date;
    }
    this.host?.requestUpdate();
  }

  getWeekdayHeaders(format: 'short' | 'narrow' | 'long' = 'short'): ReadonlyArray<string> {
    const firstDay = getFirstDayOfWeek(this.locale);
    const formatter = new Intl.DateTimeFormat(this.locale, {
      weekday: format,
      timeZone: 'UTC',
    });
    // 2024-01-07 is a Sunday (day 0)
    const headers: string[] = [];
    for (let i = 0; i < 7; i += 1) {
      const dow = (firstDay + i) % 7;
      headers.push(formatter.format(new Date(Date.UTC(2024, 0, 7 + dow))));
    }
    return headers;
  }

  getMonthGrid(
    year: number = this._focusedDate.year,
    month: number = this._focusedDate.month,
  ): ReadonlyArray<ReadonlyArray<CalendarCell>> {
    const today = getTodayCalendarDate();
    const firstOfMonth: CalendarDate = { year, month, day: 1 };
    const firstDow = getDayOfWeek(firstOfMonth);
    const weekStart = getFirstDayOfWeek(this.locale);
    const leadingDays = (firstDow - weekStart + 7) % 7;
    const gridStart = addCalendarDays(firstOfMonth, -leadingDays);

    const weeks: CalendarCell[][] = [];
    let cursor = gridStart;
    for (let w = 0; w < 6; w += 1) {
      const row: CalendarCell[] = [];
      for (let d = 0; d < 7; d += 1) {
        const cellDate = cursor;
        const iso = formatIsoDate(cellDate);
        const inMonth = cellDate.year === year && cellDate.month === month;
        const isToday = compareCalendarDates(cellDate, today) === 0;
        const isDisabled = this.isDisabled(cellDate);
        const isRangeStart =
          this._rangeStart !== null && compareCalendarDates(cellDate, this._rangeStart) === 0;
        const isRangeEnd =
          this._rangeEnd !== null && compareCalendarDates(cellDate, this._rangeEnd) === 0;
        const isInRange =
          this._rangeStart !== null &&
          this._rangeEnd !== null &&
          compareCalendarDates(cellDate, this._rangeStart) >= 0 &&
          compareCalendarDates(cellDate, this._rangeEnd) <= 0;
        const isSelected =
          this.mode === 'single'
            ? this._selectedDate !== null && compareCalendarDates(cellDate, this._selectedDate) === 0
            : isRangeStart || isRangeEnd;

        row.push({
          date: cellDate,
          iso,
          inMonth,
          isToday,
          isDisabled,
          isSelected,
          isRangeStart,
          isRangeEnd,
          isInRange,
        });
        cursor = addCalendarDays(cursor, 1);
      }
      weeks.push(row);
    }
    return weeks;
  }
}

export function getFirstDayOfWeek(locale: string): number {
  try {
    const loc = new Intl.Locale(locale) as Intl.Locale & {
      getWeekInfo?: () => { firstDay: number };
      weekInfo?: { firstDay: number };
    };
    const info = loc.getWeekInfo?.() ?? loc.weekInfo;
    if (info && typeof info.firstDay === 'number') {
      // Intl weekInfo uses 1=Mon..7=Sun; normalize to 0=Sun..6=Sat
      return info.firstDay === 7 ? 0 : info.firstDay;
    }
    const region = loc.maximize().region;
    if (region && SUNDAY_START_TERRITORIES.has(region)) {
      return 0;
    }
  } catch {
    // Fallback below.
  }
  return 1;
}

export function getTodayCalendarDate(): CalendarDate {
  const g = globalThis as {
    Temporal?: { Now?: { plainDateISO?: () => { year: number; month: number; day: number } } };
  };
  const temporalToday = g.Temporal?.Now?.plainDateISO?.();
  if (temporalToday) {
    return {
      year: temporalToday.year,
      month: temporalToday.month,
      day: temporalToday.day,
    };
  }
  const now = new Date();
  return {
    year: now.getFullYear(),
    month: now.getMonth() + 1,
    day: now.getDate(),
  };
}

export function formatIsoDate(date: CalendarDate): string {
  const y = String(date.year).padStart(4, '0');
  const m = String(date.month).padStart(2, '0');
  const d = String(date.day).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function compareCalendarDates(a: CalendarDate, b: CalendarDate): number {
  if (a.year !== b.year) return a.year - b.year;
  if (a.month !== b.month) return a.month - b.month;
  return a.day - b.day;
}

export function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

export function getDayOfWeek(date: CalendarDate): number {
  return new Date(Date.UTC(date.year, date.month - 1, date.day)).getUTCDay();
}

export function addCalendarDays(date: CalendarDate, deltaDays: number): CalendarDate {
  const d = new Date(Date.UTC(date.year, date.month - 1, date.day + deltaDays));
  return {
    year: d.getUTCFullYear(),
    month: d.getUTCMonth() + 1,
    day: d.getUTCDate(),
  };
}

export function addCalendarMonths(date: CalendarDate, deltaMonths: number): CalendarDate {
  const totalMonths = date.year * 12 + (date.month - 1) + deltaMonths;
  const nextYear = Math.floor(totalMonths / 12);
  const nextMonth = ((totalMonths % 12) + 12) % 12 + 1;
  const maxDay = daysInMonth(nextYear, nextMonth);
  return {
    year: nextYear,
    month: nextMonth,
    day: Math.min(date.day, maxDay),
  };
}

function clampCalendarDate(
  date: CalendarDate,
  min?: CalendarDate,
  max?: CalendarDate,
): CalendarDate {
  if (min && compareCalendarDates(date, min) < 0) return min;
  if (max && compareCalendarDates(date, max) > 0) return max;
  return date;
}

const RRULE_DAYS: Record<string, number> = {
  SU: 0,
  MO: 1,
  TU: 2,
  WE: 3,
  TH: 4,
  FR: 5,
  SA: 6,
};

/**
 * Expands an RFC 5545 `RRULE` string (`DAILY`, `WEEKLY`, `MONTHLY`, `YEARLY`,
 * `INTERVAL`, `COUNT`, `UNTIL`, `BYDAY`, `BYMONTHDAY`, `BYMONTH`) up to `rangeEnd`.
 */
export function expandRRule(
  rrule: string,
  dtStart: CalendarDate,
  rangeEnd: CalendarDate,
): CalendarDate[] {
  const normalized = rrule.replace(/^RRULE:/i, '').trim();
  const params = new Map<string, string>();
  for (const part of normalized.split(';')) {
    const [k, v] = part.split('=');
    if (k && v) {
      params.set(k.toUpperCase(), v.toUpperCase());
    }
  }

  const freq = params.get('FREQ');
  if (!freq) return [dtStart];
  const interval = Math.max(1, Number.parseInt(params.get('INTERVAL') ?? '1', 10) || 1);
  const countLimit = params.has('COUNT')
    ? Math.max(1, Number.parseInt(params.get('COUNT')!, 10) || 1)
    : Number.POSITIVE_INFINITY;
  const untilRaw = params.get('UNTIL');
  const untilDate = untilRaw ? parseCompactIsoDate(untilRaw) : null;
  const effectiveEnd =
    untilDate && compareCalendarDates(untilDate, rangeEnd) < 0 ? untilDate : rangeEnd;

  const byDay = params.get('BYDAY')?.split(',').map((d) => RRULE_DAYS[d]).filter((n): n is number => n !== undefined);
  const byMonthDay = params.get('BYMONTHDAY')?.split(',').map((n) => Number.parseInt(n, 10)).filter((n) => !Number.isNaN(n));
  const byMonth = params.get('BYMONTH')?.split(',').map((n) => Number.parseInt(n, 10)).filter((n) => !Number.isNaN(n));

  const results: CalendarDate[] = [];
  const safetyLimit = 1000;

  if (freq === 'WEEKLY') {
    let weekStart = addCalendarDays(dtStart, -getDayOfWeek(dtStart));
    const targetDays = byDay && byDay.length > 0 ? [...byDay].sort((a, b) => a - b) : [getDayOfWeek(dtStart)];

    while (results.length < countLimit && results.length < safetyLimit) {
      if (compareCalendarDates(weekStart, effectiveEnd) > 0) break;
      for (const dow of targetDays) {
        const candidate = addCalendarDays(weekStart, dow);
        if (compareCalendarDates(candidate, dtStart) < 0) continue;
        if (compareCalendarDates(candidate, effectiveEnd) > 0) return results;
        if (!byMonth || byMonth.includes(candidate.month)) {
          results.push(candidate);
          if (results.length >= countLimit) return results;
        }
      }
      weekStart = addCalendarDays(weekStart, 7 * interval);
    }
    return results;
  }

  let cursor = dtStart;
  let step = 0;
  while (
    compareCalendarDates(cursor, effectiveEnd) <= 0 &&
    results.length < countLimit &&
    step < safetyLimit
  ) {
    step += 1;
    const matchesMonth = !byMonth || byMonth.includes(cursor.month);
    const matchesMonthDay = !byMonthDay || byMonthDay.includes(cursor.day);
    const matchesDay = !byDay || byDay.includes(getDayOfWeek(cursor));

    if (matchesMonth && matchesMonthDay && matchesDay) {
      results.push(cursor);
    }

    if (freq === 'DAILY') {
      cursor = addCalendarDays(cursor, interval);
    } else if (freq === 'MONTHLY') {
      cursor = addCalendarMonths(dtStart, step * interval);
    } else if (freq === 'YEARLY') {
      cursor = {
        year: dtStart.year + step * interval,
        month: dtStart.month,
        day: Math.min(dtStart.day, daysInMonth(dtStart.year + step * interval, dtStart.month)),
      };
    } else {
      break;
    }
  }

  return results;
}

function parseCompactIsoDate(raw: string): CalendarDate | null {
  const m = /^(\d{4})(\d{2})(\d{2})/.exec(raw);
  if (!m) return null;
  return {
    year: Number(m[1]),
    month: Number(m[2]),
    day: Number(m[3]),
  };
}
