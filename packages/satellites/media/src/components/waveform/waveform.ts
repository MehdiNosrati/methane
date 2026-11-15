import {
  html,
  nothing,
  property,
  registerLocaleMessages,
  state,
  svg,
  UIElement,
  type PropertyValues,
} from '@methane-ui/core';
import { MotionController } from '@methane-ui/primitives';
import {
  collectHostThemeTokens,
  createAdoptedSheet,
  isSafeMediaUrl,
  readHostToken,
  removeAdoptedSheet,
  type ThemeTokenEngine,
} from '../../shared/satellite-helpers.js';
import { WaveformMessages } from './waveform.messages.js';
import { waveformStyles } from './waveform.styles.js';

registerLocaleMessages('en', 'mth-waveform', WaveformMessages);

export interface AudioBufferLike {
  readonly duration: number;
  getChannelData(channel: number): Float32Array;
}

export class WaveformEngine implements ThemeTokenEngine {
  private readonly tokens = new Map<string, string>();
  private _bars: number[] = [];
  private _disposed = false;
  private _reducedMotion = false;
  private tokenLookup: ((name: string) => string) | null;

  constructor(tokenLookup?: (name: string) => string) {
    this.tokenLookup = tokenLookup ?? null;
  }

  static computeBarsList(rawPeaks: readonly number[], barCount: number): number[] {
    const count = Math.max(4, Math.min(256, Math.floor(barCount || 48)));
    if (rawPeaks.length === 0) {
      return Array.from({ length: count }, (_, idx) => {
        const wave = Math.abs(Math.sin((idx + 1) * 0.45));
        return Number((0.18 + wave * 0.65).toFixed(3));
      });
    }

    const result: number[] = [];
    const stride = rawPeaks.length / count;
    for (let i = 0; i < count; i++) {
      const start = Math.floor(i * stride);
      const end = Math.max(start + 1, Math.floor((i + 1) * stride));
      let peak = 0;
      for (let j = start; j < end && j < rawPeaks.length; j++) {
        const val = Math.abs(rawPeaks[j] ?? 0);
        if (Number.isFinite(val) && val > peak) {
          peak = val;
        }
      }
      result.push(Math.max(0.08, Math.min(1, Number(peak.toFixed(3)))));
    }
    return result;
  }

  get bars(): readonly number[] {
    return this._bars;
  }

  get disposed(): boolean {
    return this._disposed;
  }

  get reducedMotion(): boolean {
    return this._reducedMotion;
  }

  setReducedMotion(reduced: boolean): void {
    this._reducedMotion = reduced;
  }

  computeBars(rawPeaks: readonly number[], barCount: number): readonly number[] {
    this._bars = WaveformEngine.computeBarsList(rawPeaks, barCount);
    return this._bars;
  }

  computeFromAudioBuffer(buffer: AudioBufferLike, barCount: number): readonly number[] {
    const data = buffer.getChannelData(0);
    const sample = Array.from(data, (v) => Math.abs(v));
    return this.computeBars(sample, barCount);
  }

  getThemeToken(name: string): string {
    const live = this.tokenLookup?.(name);
    if (live) {
      this.tokens.set(name, live);
      return live;
    }
    return this.tokens.get(name) ?? '';
  }

  syncThemeTokens(tokens: Record<string, string>): void {
    this.tokens.clear();
    for (const [key, value] of Object.entries(tokens)) {
      this.tokens.set(key, value);
    }
  }

  dispose(): void {
    this._disposed = true;
    this.tokenLookup = null;
    this.tokens.clear();
    this._bars = [];
  }
}

function formatTime(seconds: number): string {
  const safe = Number.isFinite(seconds) && seconds > 0 ? Math.floor(seconds) : 0;
  const mins = Math.floor(safe / 60);
  const secs = safe % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export class MthWaveform extends UIElement {
  static override styles = waveformStyles;
  static override messages = WaveformMessages;
  static override shadowRootOptions: ShadowRootInit = {
    ...UIElement.shadowRootOptions,
    delegatesFocus: true,
  };

  @property({ type: String })
  src = '';

  @property({ type: Boolean, reflect: true })
  playing = false;

  @property({ type: Boolean, reflect: true })
  disabled = false;

  @property({ type: Number, attribute: 'current-time' })
  currentTime = 0;

  @property({ type: Number })
  duration = 0;

  @property({ type: Number, attribute: 'bar-count' })
  barCount = 48;

  @property({ type: String })
  label = '';

  @property({ attribute: false })
  peaks: readonly number[] = [];

  @state()
  private errorMessage = '';

  private _engine: WaveformEngine | null = null;
  private adoptedSheet: CSSStyleSheet | null = null;
  private readonly motion = new MotionController(this, { respectReducedMotion: true });

  get engine(): WaveformEngine | null {
    return this._engine;
  }

  override connectedCallback(): void {
    super.connectedCallback();
    this._engine = new WaveformEngine((name) => readHostToken(this, name));
    this.adoptedSheet = createAdoptedSheet(this);
    this.syncEngineState();
  }

  override disconnectedCallback(): void {
    this._engine?.dispose();
    this._engine = null;
    removeAdoptedSheet(this, this.adoptedSheet);
    this.adoptedSheet = null;
    super.disconnectedCallback();
  }

  protected override updated(changed: PropertyValues): void {
    super.updated(changed);
    if (changed.has('src') && this.errorMessage) {
      this.emitEvent('mth-error', { detail: { reason: this.errorMessage } });
    }
  }

  protected override willUpdate(changed: PropertyValues): void {
    super.willUpdate(changed);
    if (changed.has('src')) {
      if (this.src && !isSafeMediaUrl(this.src)) {
        this.errorMessage = this.t('unsafeSourceError');
        this.playing = false;
      } else {
        this.errorMessage = '';
      }
    }
    const maxTime = this.duration > 0 ? this.duration : 100;
    if (!Number.isFinite(this.currentTime) || this.currentTime < 0) {
      this.currentTime = 0;
    } else if (this.currentTime > maxTime) {
      this.currentTime = maxTime;
    }
    if (changed.has('peaks') || changed.has('barCount') || changed.has('currentTime') || changed.has('duration')) {
      this.syncEngineState();
    }
  }

  setPeaks(peaks: readonly number[]): void {
    this.peaks = [...peaks];
  }

  loadAudioBuffer(buffer: AudioBufferLike): void {
    if (!this._engine) return;
    this.duration = Number.isFinite(buffer.duration) && buffer.duration > 0 ? buffer.duration : this.duration;
    const bars = this._engine.computeFromAudioBuffer(buffer, this.barCount);
    this.peaks = [...bars];
  }

  play(): void {
    if (this.disabled || this.errorMessage) return;
    this.playing = true;
    this.syncEngineState();
    this.emitEvent('mth-play', { detail: { currentTime: this.currentTime } });
  }

  pause(): void {
    this.playing = false;
    this.syncEngineState();
    this.emitEvent('mth-pause', { detail: { currentTime: this.currentTime } });
  }

  togglePlay(): void {
    if (this.playing) {
      this.pause();
    } else {
      this.play();
    }
  }

  seekTo(seconds: number): void {
    if (this.disabled) return;
    const maxTime = this.duration > 0 ? this.duration : 100;
    const clamped = Math.max(0, Math.min(maxTime, seconds));
    this.currentTime = clamped;
    this.syncEngineState();
    const progress = maxTime > 0 ? clamped / maxTime : 0;
    this.emitEvent('mth-seek', { detail: { currentTime: clamped, progress } });
  }

  private syncEngineState(): void {
    if (!this._engine) return;
    this._engine.syncThemeTokens(collectHostThemeTokens(this));
    this._engine.setReducedMotion(this.motion.isReducedMotion);
    this._engine.computeBars(this.peaks, this.barCount);

    this.setCustomState('playing', this.playing);
    this.setCustomState('disabled', this.disabled);
    this.setCustomState('reduced-motion', this.motion.isReducedMotion);

    const maxTime = this.duration > 0 ? this.duration : 100;
    const pct = maxTime > 0 ? (this.currentTime / maxTime) * 100 : 0;
    const safePct = Math.max(0, Math.min(100, Number.isFinite(pct) ? pct : 0)).toFixed(2);
    this.adoptedSheet?.replaceSync(`:host { --_progress-pct: ${safePct}%; }`);
  }

  private handleScrubberClick = (event: MouseEvent): void => {
    if (this.disabled) return;
    const target = event.currentTarget as HTMLElement | null;
    if (!target || typeof target.getBoundingClientRect !== 'function') return;
    const rect = target.getBoundingClientRect();
    if (rect.width <= 0) return;
    let ratio = (event.clientX - rect.left) / rect.width;
    if (this.resolvedDir === 'rtl') {
      ratio = 1 - ratio;
    }
    const maxTime = this.duration > 0 ? this.duration : 100;
    this.seekTo(Math.max(0, Math.min(1, ratio)) * maxTime);
  };

  private handleScrubberKeydown = (event: KeyboardEvent): void => {
    if (this.disabled) return;
    const maxTime = this.duration > 0 ? this.duration : 100;
    const smallStep = Math.max(1, maxTime * 0.02);
    const largeStep = Math.max(1, maxTime * 0.1);
    const isRtl = this.resolvedDir === 'rtl';

    switch (event.key) {
      case 'ArrowRight':
        event.preventDefault();
        this.seekTo(this.currentTime + (isRtl ? -smallStep : smallStep));
        break;
      case 'ArrowLeft':
        event.preventDefault();
        this.seekTo(this.currentTime + (isRtl ? smallStep : -smallStep));
        break;
      case 'PageUp':
        event.preventDefault();
        this.seekTo(this.currentTime + largeStep);
        break;
      case 'PageDown':
        event.preventDefault();
        this.seekTo(this.currentTime - largeStep);
        break;
      case 'Home':
        event.preventDefault();
        this.seekTo(0);
        break;
      case 'End':
        event.preventDefault();
        this.seekTo(maxTime);
        break;
      case ' ':
      case 'Enter':
        event.preventDefault();
        this.togglePlay();
        break;
      default:
        break;
    }
  };

  override render() {
    const bars =
      this._engine && this._engine.bars.length > 0
        ? this._engine.bars
        : WaveformEngine.computeBarsList(this.peaks, this.barCount);
    const maxTime = this.duration > 0 ? this.duration : 100;
    const progressRatio = maxTime > 0 ? Math.max(0, Math.min(1, this.currentTime / maxTime)) : 0;
    const playedBarCount = Math.round(progressRatio * bars.length);
    const regionLabel = this.label.trim() || this.t('regionLabel');
    const playLabel = this.playing ? this.t('pauseLabel') : this.t('playLabel');

    return html`
      <div part="base" role="region" aria-label=${regionLabel} dir=${this.resolvedDir}>
        <div part="controls">
          <button
            type="button"
            part="play-button"
            ?disabled=${this.disabled || Boolean(this.errorMessage)}
            aria-pressed=${this.playing ? 'true' : 'false'}
            aria-label=${playLabel}
            @click=${() => this.togglePlay()}
          >
            ${this.playing ? '❚❚' : '▶'}
          </button>

          <div
            part="scrubber"
            role="slider"
            tabindex=${this.disabled ? '-1' : '0'}
            aria-label=${this.t('scrubberLabel')}
            aria-valuemin="0"
            aria-valuemax=${String(Math.round(maxTime))}
            aria-valuenow=${String(Math.round(this.currentTime))}
            aria-disabled=${this.disabled ? 'true' : 'false'}
            @click=${this.handleScrubberClick}
            @keydown=${this.handleScrubberKeydown}
          >
            <svg
              part="bars"
              viewBox="0 0 480 64"
              preserveAspectRatio="none"
              aria-hidden="true"
            >
              ${bars.map((amp, index) => {
                const slotW = 480 / bars.length;
                const barW = Math.max(2, slotW * 0.62);
                const x = index * slotW + (slotW - barW) / 2;
                const h = Math.max(6, amp * 56);
                const y = (64 - h) / 2;
                const isPlayed = index < playedBarCount;
                return svg`<rect
                  class=${isPlayed ? 'bar-played' : 'bar-unplayed'}
                  x=${x.toFixed(2)}
                  y=${y.toFixed(2)}
                  width=${barW.toFixed(2)}
                  height=${h.toFixed(2)}
                  rx="1"
                />`;
              })}
            </svg>
            <div part="progress" aria-hidden="true"></div>
          </div>

          <span part="time">${formatTime(this.currentTime)} / ${formatTime(this.duration)}</span>
          <slot name="controls"></slot>
        </div>

        ${this.errorMessage
          ? html`<div part="status-row" role="alert">${this.errorMessage}</div>`
          : nothing}
        <slot name="fallback"></slot>
      </div>
    `;
  }
}
