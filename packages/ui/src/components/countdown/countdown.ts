import { UIElement, type PropertyValues } from '@methane/core';
import { html, nothing } from 'lit';
import { property, state } from 'lit/decorators.js';
import { countdownMessages } from './countdown.messages.js';
import { countdownStyles } from './countdown.styles.js';

export type CountdownPrecision = 'seconds' | 'minutes';
export type CountdownFormat = 'hms' | 'dhms';

/**
 * `<mth-countdown>`: Semantic countdown `<time datetime>` component with
 * throttled polite live announcements and clean timer lifecycle teardown.
 */
export class MthCountdown extends UIElement {
  static override messages = countdownMessages;
  static override styles = countdownStyles;

  @property({ type: String, reflect: true })
  target = '';

  @property({ type: Number })
  duration = 0;

  @property({ type: Boolean, reflect: true })
  running = true;

  @property({ type: String })
  precision: CountdownPrecision = 'seconds';

  @property({ type: String })
  format: CountdownFormat = 'dhms';

  @property({ type: Number, attribute: 'announce-interval' })
  announceInterval = 30;

  @state()
  private remainingMs = 0;

  @state()
  private statusAnnouncement = '';

  private targetTimestampMs = 0;
  private timerId: ReturnType<typeof setInterval> | null = null;
  private lastAnnouncedSecond = -1;
  private completeEmitted = false;

  override connectedCallback(): void {
    super.connectedCallback();
    this.syncRemainingFromProps();
    this.syncTimer();
  }

  override disconnectedCallback(): void {
    this.clearTimer();
    super.disconnectedCallback();
  }

  protected override willUpdate(changed: PropertyValues): void {
    super.willUpdate(changed);
    if (changed.has('target') || changed.has('duration')) {
      this.completeEmitted = false;
      this.lastAnnouncedSecond = -1;
      this.syncRemainingFromProps();
    }
    if (changed.has('running') || changed.has('target') || changed.has('duration')) {
      this.syncTimer();
    }
    this.setCustomState('running', this.running && this.remainingMs > 0);
    this.setCustomState('complete', this.remainingMs <= 0);
  }

  start(): void {
    if (this.remainingMs <= 0 && !this.target && this.duration > 0) {
      this.reset();
    }
    if (!this.target) {
      this.targetTimestampMs = Date.now() + this.remainingMs;
    }
    this.running = true;
    this.syncTimer();
  }

  pause(): void {
    this.running = false;
    this.clearTimer();
  }

  reset(): void {
    this.completeEmitted = false;
    this.lastAnnouncedSecond = -1;
    this.statusAnnouncement = '';
    this.syncRemainingFromProps(true);
    this.syncTimer();
  }

  private syncRemainingFromProps(forceDuration = false): void {
    if (this.target && !forceDuration) {
      const parsed = Date.parse(this.target);
      this.targetTimestampMs = Number.isNaN(parsed) ? Date.now() : parsed;
      this.remainingMs = Math.max(0, this.targetTimestampMs - Date.now());
      return;
    }
    const ms = Math.max(0, Math.round((this.duration || 0) * 1000));
    this.targetTimestampMs = Date.now() + ms;
    this.remainingMs = ms;
  }

  private clearTimer(): void {
    if (this.timerId !== null) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
  }

  private syncTimer(): void {
    this.clearTimer();
    if (!this.isConnected || !this.running || this.remainingMs <= 0) {
      return;
    }
    this.timerId = setInterval(() => {
      this.tick();
    }, 1000);
  }

  private tick(): void {
    const next = Math.max(0, this.targetTimestampMs - Date.now());
    this.remainingMs = next;
    const parts = this.breakdown(next);

    this.emitEvent('mth-tick', {
      detail: { remainingMs: next, ...parts },
    });

    const totalSec = Math.ceil(next / 1000);
    if (
      next > 0 &&
      this.announceInterval > 0 &&
      totalSec % this.announceInterval === 0 &&
      totalSec !== this.lastAnnouncedSecond
    ) {
      this.lastAnnouncedSecond = totalSec;
      this.statusAnnouncement = this.t('remainingAnnouncement', {
        time: `${parts.hours}:${String(parts.minutes).padStart(2, '0')}:${String(parts.seconds).padStart(2, '0')}`,
      });
    }

    if (next <= 0) {
      this.clearTimer();
      this.running = false;
      this.statusAnnouncement = this.t('completed');
      if (!this.completeEmitted) {
        this.completeEmitted = true;
        this.emitEvent('mth-complete', {
          detail: { target: this.target },
        });
      }
    }
  }

  private breakdown(ms: number): { days: number; hours: number; minutes: number; seconds: number } {
    const totalSeconds = Math.max(0, Math.ceil(ms / 1000));
    const seconds = totalSeconds % 60;
    const totalMinutes = Math.floor(totalSeconds / 60);
    const minutes = totalMinutes % 60;
    const totalHours = Math.floor(totalMinutes / 60);
    if (this.format === 'hms') {
      return { days: 0, hours: totalHours, minutes, seconds };
    }
    const days = Math.floor(totalHours / 24);
    const hours = totalHours % 24;
    return { days, hours, minutes, seconds };
  }

  private formatIsoDuration(parts: { days: number; hours: number; minutes: number; seconds: number }): string {
    const d = parts.days > 0 ? `${parts.days}D` : '';
    return `P${d}T${parts.hours}H${parts.minutes}M${parts.seconds}S`;
  }

  override render() {
    const parts = this.breakdown(this.remainingMs);
    const pad = (n: number) => String(n).padStart(2, '0');
    const isComplete = this.remainingMs <= 0;

    return html`
      <div part="base" class="base" role="timer" aria-label=${this.t('regionLabel')}>
        <slot name="prefix"></slot>
        <time part="time" class="time" datetime=${this.formatIsoDuration(parts)}>
          ${this.format === 'dhms' && parts.days > 0
            ? html`
                <div part="segment" class="segment">
                  <span part="value" class="value">${pad(parts.days)}</span>
                  <span part="unit" class="unit">${this.t('daysLabel')}</span>
                </div>
              `
            : nothing}
          <div part="segment" class="segment">
            <span part="value" class="value">${pad(parts.hours)}</span>
            <span part="unit" class="unit">${this.t('hoursLabel')}</span>
          </div>
          <div part="segment" class="segment">
            <span part="value" class="value">${pad(parts.minutes)}</span>
            <span part="unit" class="unit">${this.t('minutesLabel')}</span>
          </div>
          ${this.precision === 'seconds'
            ? html`
                <div part="segment" class="segment">
                  <span part="value" class="value">${pad(parts.seconds)}</span>
                  <span part="unit" class="unit">${this.t('secondsLabel')}</span>
                </div>
              `
            : nothing}
        </time>
        ${isComplete ? html`<slot name="complete"></slot>` : nothing}
        <div part="status" class="sr-only" role="status" aria-live="polite">
          ${this.statusAnnouncement}
        </div>
      </div>
    `;
  }
}
