import { devWarn, UIElement, type PropertyValues } from '@methane-ui/core';
import { html, nothing } from 'lit';
import { property, query, state } from 'lit/decorators.js';
import { audioPlayerMessages } from './audio-player.messages.js';
import { audioPlayerStyles } from './audio-player.styles.js';

const PLAYBACK_RATES = [1, 1.25, 1.5, 2] as const;

function isSafeAudioUrl(raw: string): boolean {
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
 * `<mth-audio-player>`: accessible custom audio player with safe-URL checks,
 * track metadata, seek bar, mute, and playback rate controls.
 */
export class MthAudioPlayer extends UIElement {
  static override shadowRootOptions = { mode: 'open' as const, delegatesFocus: true };
  static override messages = audioPlayerMessages;
  static override styles = audioPlayerStyles;

  @property({ type: String, reflect: true })
  src = '';

  @property({ type: String })
  override title = '';

  @property({ type: String })
  artist = '';

  @property({ type: String })
  label = '';

  @property({ type: Boolean, reflect: true })
  autoplay = false;

  @property({ type: Boolean, reflect: true })
  loop = false;

  @property({ type: Boolean, reflect: true })
  muted = false;

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

  @query('.audio')
  private audioEl?: HTMLAudioElement;

  override connectedCallback(): void {
    super.connectedCallback();
    this.syncCustomStates();
  }

  protected override updated(changed: PropertyValues<this>): void {
    super.updated(changed);
    if (changed.has('playbackRate') && this.audioEl) {
      this.audioEl.playbackRate = this.playbackRate || 1;
    }
    if (changed.has('muted') && this.audioEl) {
      this.audioEl.muted = this.muted;
    }
    this.syncCustomStates();
  }

  async play(): Promise<void> {
    if (!this.resolveSafeSrc()) return;
    this.playing = true;
    this.syncCustomStates();
    if (this.audioEl && typeof this.audioEl.play === 'function') {
      try {
        await Promise.resolve(this.audioEl.play()).catch(() => {});
      } catch {
        // Ignore playback rejection in headless/JSDOM.
      }
    }
    this.dispatchEvent(new CustomEvent('mth-play', { bubbles: true, composed: true }));
  }

  pause(): void {
    this.playing = false;
    this.syncCustomStates();
    if (this.audioEl && typeof this.audioEl.pause === 'function') {
      try {
        this.audioEl.pause();
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
    if (this.audioEl) {
      this.audioEl.currentTime = safe;
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
    if (this.audioEl) {
      this.audioEl.muted = this.muted;
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

  private resolveSafeSrc(): string | undefined {
    const trimmed = this.src.trim();
    if (!trimmed) return undefined;
    if (!isSafeAudioUrl(trimmed)) {
      devWarn(`<mth-audio-player> rejected unsafe src "${trimmed}".`);
      return undefined;
    }
    return trimmed;
  }

  protected override render() {
    const safeSrc = this.resolveSafeSrc();
    const maxDuration = this.duration > 0 ? this.duration : 100;

    return html`
      <div
        class="base"
        part="base"
        role="region"
        aria-label=${this.label || this.title || this.t('playerLabel')}
      >
        ${safeSrc
          ? html`
              <audio
                class="audio"
                part="audio"
                src=${safeSrc}
                ?autoplay=${this.autoplay}
                ?loop=${this.loop}
                ?muted=${this.muted}
                preload=${this.preload}
                @loadedmetadata=${(e: Event) => {
                  const audio = e.currentTarget as HTMLAudioElement;
                  this.duration = Number.isFinite(audio.duration) ? audio.duration : 0;
                }}
                @timeupdate=${(e: Event) => {
                  const audio = e.currentTarget as HTMLAudioElement;
                  this.currentTime = audio.currentTime || 0;
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
              ></audio>
            `
          : nothing}

        <button
          type="button"
          class="btn"
          part="play-button"
          aria-label=${this.playing ? this.t('pause') : this.t('play')}
          ?disabled=${!safeSrc}
          @click=${() => this.togglePlay()}
        >
          ${this.playing ? '❚❚' : '▶'}
        </button>

        ${this.title || this.artist
          ? html`
              <div class="meta" part="meta">
                ${this.title ? html`<span class="title">${this.title}</span>` : nothing}
                ${this.artist ? html`<span class="artist">${this.artist}</span>` : nothing}
              </div>
            `
          : nothing}

        <input
          type="range"
          class="seek"
          part="seek"
          aria-label=${this.t('seekLabel')}
          min="0"
          max=${String(maxDuration)}
          step="1"
          .value=${String(this.currentTime)}
          ?disabled=${!safeSrc}
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
          ?disabled=${!safeSrc}
          @click=${() => this.toggleMute()}
        >
          ${this.muted ? '🔇' : '🔊'}
        </button>

        <button
          type="button"
          class="btn"
          part="rate-button"
          aria-label=${this.t('playbackRateLabel')}
          ?disabled=${!safeSrc}
          @click=${() => this.cyclePlaybackRate()}
        >
          ${`${this.playbackRate}x`}
        </button>
      </div>
    `;
  }
}
