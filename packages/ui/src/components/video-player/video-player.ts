import { devWarn, UIElement, type PropertyValues } from '@methane-ui/core';
import { html, nothing } from 'lit';
import { property, query, state } from 'lit/decorators.js';
import { videoPlayerMessages } from './video-player.messages.js';
import { videoPlayerStyles } from './video-player.styles.js';

const PLAYBACK_RATES = [1, 1.25, 1.5, 2] as const;

function isSafeMediaUrl(raw: string): boolean {
  const trimmed = raw.trim();
  if (!trimmed) return false;
  // eslint-disable-next-line no-control-regex
  if (/[\u0000-\u001f\u007f]/.test(trimmed)) return false;
  if (trimmed.startsWith('//') || trimmed.startsWith('/\\') || trimmed.startsWith('\\\\')) {
    return false;
  }
  if (/^(\/|\.\/|\.\.\/)/.test(trimmed)) return true;
  const schemeMatch = /^([a-zA-Z][a-zA-Z0-9+.-]*):/.exec(trimmed);
  if (!schemeMatch) return !trimmed.startsWith('//');
  const scheme = schemeMatch[1]!.toLowerCase();
  return scheme === 'https' || scheme === 'http';
}

function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return '0:00';
  const total = Math.floor(seconds);
  const mins = Math.floor(total / 60);
  const secs = total % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

/**
 * `<mth-video-player>`: accessible custom-chrome HTML5 video player with safe-URL
 * checks, timeline seeking, volume, playback rate, and fullscreen controls.
 */
export class MthVideoPlayer extends UIElement {
  static override shadowRootOptions = { mode: 'open' as const, delegatesFocus: true };
  static override messages = videoPlayerMessages;
  static override styles = videoPlayerStyles;

  @property({ type: String, reflect: true })
  src = '';

  @property({ type: String, reflect: true })
  poster = '';

  @property({ type: String })
  label = '';

  @property({ type: Boolean, reflect: true })
  autoplay = false;

  @property({ type: Boolean, reflect: true })
  loop = false;

  @property({ type: Boolean, reflect: true })
  muted = false;

  @property({ type: Boolean })
  playsinline = true;

  @property({ type: String })
  preload: 'metadata' | 'auto' | 'none' = 'metadata';

  @property({ type: Number, attribute: 'playback-rate' })
  playbackRate = 1;

  @state()
  private playing = false;

  @state()
  private currentTime = 0;

  @state()
  private duration = 0;

  @state()
  private volume = 1;

  @query('.base')
  private baseEl!: HTMLElement;

  @query('.video')
  private videoEl?: HTMLVideoElement;

  override connectedCallback(): void {
    super.connectedCallback();
    this.syncCustomStates();
  }

  protected override updated(changed: PropertyValues<this>): void {
    super.updated(changed);
    if (changed.has('playbackRate') && this.videoEl) {
      this.videoEl.playbackRate = this.playbackRate || 1;
    }
    if (changed.has('muted') && this.videoEl) {
      this.videoEl.muted = this.muted;
    }
    this.syncCustomStates();
  }

  async play(): Promise<void> {
    if (!this.resolveSafeUrl(this.src)) return;
    this.playing = true;
    this.syncCustomStates();
    if (this.videoEl && typeof this.videoEl.play === 'function') {
      try {
        await Promise.resolve(this.videoEl.play()).catch(() => {});
      } catch {
        // Ignore playback rejection in headless/autoplay-blocked environments.
      }
    }
    this.dispatchEvent(new CustomEvent('mth-play', { bubbles: true, composed: true }));
  }

  pause(): void {
    this.playing = false;
    this.syncCustomStates();
    if (this.videoEl && typeof this.videoEl.pause === 'function') {
      try {
        this.videoEl.pause();
      } catch {
        // Ignore unimplemented pause in JSDOM.
      }
    }
    this.dispatchEvent(new CustomEvent('mth-pause', { bubbles: true, composed: true }));
  }

  togglePlay(): void {
    if (this.playing) {
      this.pause();
    } else {
      void this.play();
    }
  }

  seek(seconds: number): void {
    const safe = Number.isFinite(seconds) ? Math.max(0, seconds) : 0;
    this.currentTime = safe;
    if (this.videoEl) {
      this.videoEl.currentTime = safe;
    }
    this.dispatchEvent(
      new CustomEvent<{ currentTime: number; duration: number }>('mth-timeupdate', {
        bubbles: true,
        composed: true,
        detail: { currentTime: this.currentTime, duration: this.duration },
      }),
    );
  }

  toggleMute(): void {
    this.muted = !this.muted;
    if (this.videoEl) {
      this.videoEl.muted = this.muted;
    }
    this.syncCustomStates();
  }

  cyclePlaybackRate(): void {
    const idx = PLAYBACK_RATES.indexOf(this.playbackRate as (typeof PLAYBACK_RATES)[number]);
    const next = PLAYBACK_RATES[(idx + 1) % PLAYBACK_RATES.length] ?? 1;
    this.playbackRate = next;
  }

  private syncCustomStates(): void {
    this.setCustomState('playing', this.playing);
    this.setCustomState('paused', !this.playing);
    this.setCustomState('muted', this.muted);
  }

  private resolveSafeUrl(raw: string): string | undefined {
    const trimmed = raw.trim();
    if (!trimmed) return undefined;
    if (!isSafeMediaUrl(trimmed)) {
      devWarn(`<mth-video-player> rejected unsafe URL "${trimmed}".`);
      return undefined;
    }
    return trimmed;
  }

  private handleKeyDown = (e: KeyboardEvent): void => {
    const target = e.target as HTMLElement | null;
    if (target?.tagName === 'INPUT') return;
    if (e.key === 'k' || e.key === ' ') {
      e.preventDefault();
      this.togglePlay();
    } else if (e.key === 'm') {
      e.preventDefault();
      this.toggleMute();
    }
  };

  protected override render() {
    const safeSrc = this.resolveSafeUrl(this.src);
    const safePoster = this.resolveSafeUrl(this.poster);
    const maxDuration = this.duration > 0 ? this.duration : 100;

    return html`
      <div
        class="base"
        part="base"
        role="region"
        aria-label=${this.label || this.t('playerLabel')}
        @keydown=${this.handleKeyDown}
      >
        ${safeSrc
          ? html`
              <video
                class="video"
                part="video"
                src=${safeSrc}
                poster=${safePoster ?? nothing}
                ?autoplay=${this.autoplay}
                ?loop=${this.loop}
                ?muted=${this.muted}
                ?playsinline=${this.playsinline}
                preload=${this.preload}
                @loadedmetadata=${(e: Event) => {
                  const vid = e.currentTarget as HTMLVideoElement;
                  this.duration = Number.isFinite(vid.duration) ? vid.duration : 0;
                }}
                @timeupdate=${(e: Event) => {
                  const vid = e.currentTarget as HTMLVideoElement;
                  this.currentTime = vid.currentTime || 0;
                  this.dispatchEvent(
                    new CustomEvent<{ currentTime: number; duration: number }>('mth-timeupdate', {
                      bubbles: true,
                      composed: true,
                      detail: { currentTime: this.currentTime, duration: this.duration },
                    }),
                  );
                }}
                @ended=${() => {
                  this.playing = false;
                  this.syncCustomStates();
                  this.dispatchEvent(new CustomEvent('mth-ended', { bubbles: true, composed: true }));
                }}
              >
                <slot></slot>
              </video>
            `
          : html`<div class="invalid">${this.t('invalidSource')}</div>`}

        <div class="controls" part="controls">
          <button
            type="button"
            class="btn"
            part="play-button"
            aria-label=${this.playing ? this.t('pause') : this.t('play')}
            @click=${() => this.togglePlay()}
          >
            ${this.playing ? '❚❚' : '▶'}
          </button>

          <input
            type="range"
            class="seek"
            part="seek"
            aria-label=${this.t('seekLabel')}
            min="0"
            max=${String(maxDuration)}
            step="1"
            .value=${String(this.currentTime)}
            @input=${(e: Event) => {
              this.seek(Number((e.currentTarget as HTMLInputElement).value));
            }}
          />

          <span class="time" part="time">
            ${`${formatTime(this.currentTime)} / ${formatTime(this.duration)}`}
          </span>

          <button
            type="button"
            class="btn"
            part="mute-button"
            aria-label=${this.muted ? this.t('unmute') : this.t('mute')}
            @click=${() => this.toggleMute()}
          >
            ${this.muted ? '🔇' : '🔊'}
          </button>

          <input
            type="range"
            class="volume"
            part="volume"
            aria-label=${this.t('volumeLabel')}
            min="0"
            max="1"
            step="0.1"
            .value=${String(this.muted ? 0 : this.volume)}
            @input=${(e: Event) => {
              const nextVol = Number((e.currentTarget as HTMLInputElement).value);
              this.volume = nextVol;
              this.muted = nextVol === 0;
              if (this.videoEl) {
                this.videoEl.volume = nextVol;
                this.videoEl.muted = this.muted;
              }
              this.syncCustomStates();
            }}
          />

          <button
            type="button"
            class="btn"
            part="rate-button"
            aria-label=${this.t('playbackRateLabel')}
            @click=${() => this.cyclePlaybackRate()}
          >
            ${`${this.playbackRate}x`}
          </button>

          <button
            type="button"
            class="btn"
            part="fullscreen-button"
            aria-label=${this.t('fullscreen')}
            @click=${() => {
              if (typeof document !== 'undefined' && document.fullscreenElement) {
                void document.exitFullscreen?.();
              } else {
                void this.baseEl?.requestFullscreen?.();
              }
            }}
          >
            ⛶
          </button>
        </div>
      </div>
    `;
  }
}
