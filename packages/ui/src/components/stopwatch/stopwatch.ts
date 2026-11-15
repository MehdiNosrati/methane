import { UIElement, type PropertyValues } from '@methane-ui/core';
import { html, nothing } from 'lit';
import { property, state } from 'lit/decorators.js';
import { stopwatchMessages } from './stopwatch.messages.js';
import { stopwatchStyles } from './stopwatch.styles.js';

export interface StopwatchLap {
  readonly index: number;
  readonly lapMs: number;
  readonly totalMs: number;
}

/**
 * `<mth-stopwatch>`: Interactive stopwatch with start/pause/lap/reset controls,
 * tabular numerals, timer lifecycle cleanup, and discrete live announcements.
 */
export class MthStopwatch extends UIElement {
  static override shadowRootOptions = { ...UIElement.shadowRootOptions, delegatesFocus: true };
  static override messages = stopwatchMessages;
  static override styles = stopwatchStyles;

  @property({ type: Boolean, reflect: true })
  running = false;

  @property({ type: Boolean, attribute: 'show-milliseconds' })
  showMilliseconds = true;

  @property({ type: Boolean, reflect: true })
  disabled = false;

  @state()
  private currentElapsedMs = 0;

  @state()
  private recordedLaps: StopwatchLap[] = [];

  @state()
  private statusAnnouncement = '';

  private accumulatedMs = 0;
  private startedAtMs: number | null = null;
  private lastLapTotalMs = 0;
  private timerId: ReturnType<typeof setInterval> | null = null;

  get elapsedMs(): number {
    if (this.running && this.startedAtMs !== null) {
      return this.accumulatedMs + Math.max(0, Date.now() - this.startedAtMs);
    }
    return this.accumulatedMs;
  }

  get laps(): ReadonlyArray<StopwatchLap> {
    return this.recordedLaps;
  }

  override connectedCallback(): void {
    super.connectedCallback();
    if (this.running) {
      if (this.startedAtMs === null) {
        this.startedAtMs = Date.now();
      }
      this.startTimer();
    }
  }

  override disconnectedCallback(): void {
    this.clearTimer();
    super.disconnectedCallback();
  }

  protected override willUpdate(changed: PropertyValues): void {
    super.willUpdate(changed);
    if (changed.has('running')) {
      if (this.running) {
        if (this.startedAtMs === null) {
          this.startedAtMs = Date.now();
        }
        this.startTimer();
      } else {
        this.commitElapsed();
        this.clearTimer();
      }
    }
    this.setCustomState('running', this.running);
    this.setCustomState('disabled', this.disabled);
  }

  start(): void {
    if (this.disabled || this.running) return;
    this.startedAtMs = Date.now();
    this.running = true;
    this.startTimer();
    this.statusAnnouncement = this.t('startedAnnouncement');
    this.emitEvent('mth-start', {
      detail: { elapsedMs: this.elapsedMs },
    });
  }

  pause(): void {
    if (!this.running) return;
    this.commitElapsed();
    this.running = false;
    this.clearTimer();
    this.statusAnnouncement = this.t('pausedAnnouncement');
    this.emitEvent('mth-pause', {
      detail: { elapsedMs: this.currentElapsedMs },
    });
  }

  reset(): void {
    if (this.disabled) return;
    this.clearTimer();
    this.running = false;
    this.startedAtMs = null;
    this.accumulatedMs = 0;
    this.lastLapTotalMs = 0;
    this.currentElapsedMs = 0;
    this.recordedLaps = [];
    this.statusAnnouncement = this.t('resetAnnouncement');
    this.emitEvent('mth-reset', {
      detail: { elapsedMs: 0 },
    });
  }

  lap(): StopwatchLap | null {
    if (this.disabled) return null;
    const totalMs = this.elapsedMs;
    const lapMs = Math.max(0, totalMs - this.lastLapTotalMs);
    this.lastLapTotalMs = totalMs;
    const entry: StopwatchLap = {
      index: this.recordedLaps.length + 1,
      lapMs,
      totalMs,
    };
    this.recordedLaps = [entry, ...this.recordedLaps];
    this.statusAnnouncement = this.t('lapAnnouncement', {
      index: entry.index,
      time: this.formatDuration(lapMs),
    });
    this.emitEvent('mth-lap', {
      detail: entry,
    });
    return entry;
  }

  private commitElapsed(): void {
    if (this.startedAtMs !== null) {
      this.accumulatedMs += Math.max(0, Date.now() - this.startedAtMs);
      this.startedAtMs = null;
      this.currentElapsedMs = this.accumulatedMs;
    }
  }

  private clearTimer(): void {
    if (this.timerId !== null) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
  }

  private startTimer(): void {
    this.clearTimer();
    if (!this.isConnected || !this.running) return;
    const interval = this.showMilliseconds ? 50 : 250;
    this.timerId = setInterval(() => {
      this.currentElapsedMs = this.elapsedMs;
    }, interval);
  }

  private formatDuration(ms: number): string {
    const safeMs = Math.max(0, Math.floor(ms));
    const hours = Math.floor(safeMs / 3_600_000);
    const minutes = Math.floor((safeMs % 3_600_000) / 60_000);
    const seconds = Math.floor((safeMs % 60_000) / 1000);
    const centiseconds = Math.floor((safeMs % 1000) / 10);
    const pad = (n: number) => String(n).padStart(2, '0');
    const base = hours > 0 ? `${pad(hours)}:${pad(minutes)}:${pad(seconds)}` : `${pad(minutes)}:${pad(seconds)}`;
    return this.showMilliseconds ? `${base}.${pad(centiseconds)}` : base;
  }

  private formatIsoDuration(ms: number): string {
    const totalSec = Math.max(0, ms) / 1000;
    return `PT${totalSec.toFixed(2)}S`;
  }

  override render() {
    const toggleLabel = this.running
      ? this.t('pause')
      : this.currentElapsedMs > 0
        ? this.t('resume')
        : this.t('start');

    return html`
      <div part="base" class="base" role="region" aria-label=${this.t('regionLabel')}>
        <time part="time" class="time" datetime=${this.formatIsoDuration(this.currentElapsedMs)}>
          ${this.formatDuration(this.currentElapsedMs)}
        </time>

        <div part="controls" class="controls">
          <button
            type="button"
            part="toggle"
            class="btn btn--primary"
            ?disabled=${this.disabled}
            @click=${() => (this.running ? this.pause() : this.start())}
          >
            ${toggleLabel}
          </button>
          <button
            type="button"
            part="lap"
            class="btn"
            ?disabled=${this.disabled || !this.running}
            @click=${() => this.lap()}
          >
            ${this.t('lap')}
          </button>
          <button
            type="button"
            part="reset"
            class="btn"
            ?disabled=${this.disabled || (this.currentElapsedMs === 0 && this.recordedLaps.length === 0)}
            @click=${() => this.reset()}
          >
            ${this.t('reset')}
          </button>
          <slot name="controls"></slot>
        </div>

        ${this.recordedLaps.length > 0
          ? html`
              <ol part="laps" class="laps" aria-label=${this.t('lapsLabel')}>
                ${this.recordedLaps.map(
                  (entry) => html`
                    <li part="lap-item" class="lap-item">
                      <span>#${entry.index}</span>
                      <span>+${this.formatDuration(entry.lapMs)}</span>
                      <span>${this.formatDuration(entry.totalMs)}</span>
                    </li>
                  `,
                )}
              </ol>
            `
          : nothing}

        <div part="status" class="sr-only" role="status" aria-live="polite">
          ${this.statusAnnouncement}
        </div>
      </div>
    `;
  }
}
