export const FormattingUtils = {
  formatNumber(
    value: number,
    locale = 'en',
    options?: Intl.NumberFormatOptions,
  ): string {
    return new Intl.NumberFormat(locale, options).format(value);
  },

  formatCurrency(
    value: number,
    currency: string,
    locale = 'en',
    options?: Omit<Intl.NumberFormatOptions, 'style' | 'currency'>,
  ): string {
    return new Intl.NumberFormat(locale, {
      ...options,
      style: 'currency',
      currency,
    }).format(value);
  },

  formatPercent(
    value: number,
    locale = 'en',
    options?: Omit<Intl.NumberFormatOptions, 'style'>,
  ): string {
    return new Intl.NumberFormat(locale, {
      ...options,
      style: 'percent',
    }).format(value);
  },

  formatCompactNumber(value: number, locale = 'en'): string {
    return new Intl.NumberFormat(locale, {
      notation: 'compact',
      maximumFractionDigits: 1,
    }).format(value);
  },

  formatDate(
    date: Date | number | string,
    locale = 'en',
    options?: Intl.DateTimeFormatOptions,
  ): string {
    const d = date instanceof Date ? date : new Date(date);
    return new Intl.DateTimeFormat(locale, options).format(d);
  },

  formatDateRange(
    start: Date | number | string,
    end: Date | number | string,
    locale = 'en',
    options?: Intl.DateTimeFormatOptions,
  ): string {
    const startDate = start instanceof Date ? start : new Date(start);
    const endDate = end instanceof Date ? end : new Date(end);
    const fmt = new Intl.DateTimeFormat(locale, options);
    if (typeof fmt.formatRange === 'function') {
      return fmt.formatRange(startDate, endDate);
    }
    return `${fmt.format(startDate)} – ${fmt.format(endDate)}`;
  },

  formatRelativeTime(
    target: Date | number,
    locale = 'en',
    nowMs: number = Date.now(),
    numeric: Intl.RelativeTimeFormatNumeric = 'auto',
  ): string {
    const targetMs = target instanceof Date ? target.getTime() : target;
    const diffSeconds = Math.round((targetMs - nowMs) / 1000);
    const abs = Math.abs(diffSeconds);
    const rtf = new Intl.RelativeTimeFormat(locale, { numeric });

    if (abs < 60) {
      return rtf.format(diffSeconds, 'second');
    }
    const diffMinutes = Math.round(diffSeconds / 60);
    if (Math.abs(diffMinutes) < 60) {
      return rtf.format(diffMinutes, 'minute');
    }
    const diffHours = Math.round(diffMinutes / 60);
    if (Math.abs(diffHours) < 24) {
      return rtf.format(diffHours, 'hour');
    }
    const diffDays = Math.round(diffHours / 24);
    if (Math.abs(diffDays) < 30) {
      return rtf.format(diffDays, 'day');
    }
    const diffMonths = Math.round(diffDays / 30);
    if (Math.abs(diffMonths) < 12) {
      return rtf.format(diffMonths, 'month');
    }
    const diffYears = Math.round(diffDays / 365);
    return rtf.format(diffYears, 'year');
  },

  formatList(
    items: ReadonlyArray<string>,
    locale = 'en',
    type: Intl.ListFormatType = 'conjunction',
  ): string {
    return new Intl.ListFormat(locale, { type }).format(items);
  },

  selectPluralCategory(count: number, locale = 'en'): Intl.LDMLPluralRule {
    return new Intl.PluralRules(locale).select(count);
  },
};
