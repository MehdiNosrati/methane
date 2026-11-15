import { UIElement, type PropertyValues } from '@methane-ui/core';
import { FormattingUtils } from '@methane-ui/primitives';
import { html, nothing, svg } from 'lit';
import { property, state } from 'lit/decorators.js';
import { clockMessages } from './clock.messages.js';
import { clockStyles } from './clock.styles.js';

export type ClockVariant = 'digital' | 'analog' | 'both';

function parseClockValue(value: string): Date | null {
  if (!value) return null;
  const timeOnly = /^(\d{1,2}):(\d{2})(?::(\d{2}))?$/.exec(value.trim());
  if (timeOnly) {
    const h = Number(timeOnly[1]);
    const m = Number(timeOnly[2]);
    const s = Number(timeOnly[3] ?? '0');
    return new Date(Date.UTC(2026, 0, 1, h, m, s));
  }
  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? null : new Date(parsed);
}

/**
 * `<mth-clock>`: Analog + digital localized clock using `FormattingUtils`,
 * `<time datetime>`, and clean interval lifecycle teardown.
 */
export class MthClock extends UIElement {
  static override messages = clockMessages;
  static override styles = clockStyles;

  @property({ type: String, reflect: true })
  value = '';

  @property({ type: String, attribute: 'time-zone' })
  timeZone = '';

  @property({ type: String })
  locale = '';

  @property({ type: String, reflect: true })
  variant: ClockVariant = 'both';

  @property({ type: Boolean, attribute: 'hour-12' })
  hour12 = false;

  @property({ type: Boolean, attribute: 'show-seconds' })
  showSeconds = true;

  @property({ type: Boolean, reflect: true })
  live = true;

  @state()
  private nowMs = Date.now();

  private timerId: ReturnType<typeof setInterval> | null = null;

  override connectedCallback(): void {
    const isDsdHydration = Boolean(this.shadowRoot?.childNodes.length) && !this.hasUpdated;
    if (!this.value && isDsdHydration) {
      const ssrDatetime = this.shadowRoot?.querySelector('time')?.getAttribute('datetime');
      const parsed = ssrDatetime ? Date.parse(ssrDatetime) : Number.NaN;
      if (!Number.isNaN(parsed)) {
        this.nowMs = parsed;
      }
    }
    super.connectedCallback();
    if (!this.value && !isDsdHydration) {
      this.nowMs = Date.now();
    }
    this.syncTimer();
  }

  override disconnectedCallback(): void {
    this.clearTimer();
    super.disconnectedCallback();
  }

  protected override willUpdate(changed: PropertyValues): void {
    super.willUpdate(changed);
    if (changed.has('live') || changed.has('value')) {
      this.syncTimer();
    }
    this.setCustomState('live', this.live && !this.value);
  }

  private clearTimer(): void {
    if (this.timerId !== null) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
  }

  private syncTimer(): void {
    this.clearTimer();
    if (!this.isConnected || !this.live || Boolean(this.value)) {
      return;
    }
    this.timerId = setInterval(() => {
      this.nowMs = Date.now();
    }, 1000);
  }

  private resolveDate(): Date {
    return parseClockValue(this.value) ?? new Date(this.nowMs);
  }

  private resolveEffectiveTimeZone(): string | undefined {
    if (this.timeZone) return this.timeZone;
    if (/^\d{1,2}:\d{2}/.test(this.value.trim())) return 'UTC';
    return undefined;
  }

  private getTimeParts(date: Date, tz: string | undefined): { hours: number; minutes: number; seconds: number } {
    const formatter = new Intl.DateTimeFormat('en-US', {
      hour: 'numeric',
      minute: 'numeric',
      second: 'numeric',
      hourCycle: 'h23',
      ...(tz ? { timeZone: tz } : {}),
    });
    const parts = formatter.formatToParts(date);
    const readPart = (type: Intl.DateTimeFormatPartTypes) =>
      Number(parts.find((p) => p.type === type)?.value ?? '0');
    return {
      hours: readPart('hour') % 24,
      minutes: readPart('minute'),
      seconds: readPart('second'),
    };
  }

  override render() {
    const date = this.resolveDate();
    const effectiveLocale = this.locale || this.resolvedLocale;
    const tz = this.resolveEffectiveTimeZone();
    const formatted = FormattingUtils.formatDate(date, effectiveLocale, {
      hour: '2-digit',
      minute: '2-digit',
      ...(this.showSeconds ? { second: '2-digit' } : {}),
      hour12: this.hour12,
      ...(tz ? { timeZone: tz } : {}),
    });

    const { hours, minutes, seconds } = this.getTimeParts(date, tz);
    const secondDeg = seconds * 6;
    const minuteDeg = minutes * 6 + seconds * 0.1;
    const hourDeg = (hours % 12) * 30 + minutes * 0.5;
    const showDial = this.variant === 'analog' || this.variant === 'both';
    const showDigital = this.variant === 'digital' || this.variant === 'both';

    return html`
      <div part="base" class="base" role="region" aria-label=${this.t('regionLabel')}>
        <slot name="label"></slot>
        ${showDial
          ? html`
              <svg
                part="dial"
                class="dial"
                viewBox="0 0 100 100"
                role="img"
                aria-label=${this.t('analogDialLabel', { time: formatted })}
              >
                <circle class="face" cx="50" cy="50" r="46"></circle>
                ${[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map(
                  (deg) => svg`
                    <line
                      class="tick-mark"
                      x1="50"
                      y1="8"
                      x2="50"
                      y2="13"
                      transform="rotate(${deg} 50 50)"
                    ></line>
                  `,
                )}
                <line
                  part="hand-hour"
                  class="hand-hour"
                  x1="50"
                  y1="50"
                  x2="50"
                  y2="27"
                  transform="rotate(${hourDeg} 50 50)"
                ></line>
                <line
                  part="hand-minute"
                  class="hand-minute"
                  x1="50"
                  y1="50"
                  x2="50"
                  y2="18"
                  transform="rotate(${minuteDeg} 50 50)"
                ></line>
                ${this.showSeconds
                  ? svg`
                      <line
                        part="hand-second"
                        class="hand-second"
                        x1="50"
                        y1="54"
                        x2="50"
                        y2="14"
                        transform="rotate(${secondDeg} 50 50)"
                      ></line>
                    `
                  : nothing}
                <circle class="pivot" cx="50" cy="50" r="3"></circle>
              </svg>
            `
          : nothing}
        ${showDigital
          ? html`
              <time part="time" class="time" datetime=${date.toISOString()}>
                ${formatted}
              </time>
            `
          : nothing}
      </div>
    `;
  }
}
