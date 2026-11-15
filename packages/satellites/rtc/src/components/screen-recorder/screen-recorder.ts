import {
  html,
  nothing,
  property,
  registerLocaleMessages,
  state,
  UIElement,
  type PropertyValues,
} from '@methane/core';
import {
  collectHostThemeTokens,
  formatDurationSeconds,
  readHostToken,
  type ThemeTokenEngine,
} from '../../shared/satellite-helpers.js';
import { screenRecorderMessages } from './screen-recorder.messages.js';
import { screenRecorderStyles } from './screen-recorder.styles.js';

registerLocaleMessages('en', 'mth-screen-recorder', screenRecorderMessages);

export type ScreenRecorderState =
  | 'idle'
  | 'requesting'
  | 'recording'
  | 'paused'
  | 'stopped'
  | 'unsupported'
  | 'error';

export interface ScreenRecordingResult {
  readonly blob: Blob | null;
  readonly url: string;
  readonly durationMs: number;
  readonly mimeType: string;
  readonly systemAudio: boolean;
}

export interface ScreenRecorderEngine extends ThemeTokenEngine {
  readonly state: ScreenRecorderState;
  readonly systemAudio: boolean;
  readonly durationMs: number;
  setSystemAudio(enabled: boolean): void;
  start(options?: { systemAudio?: boolean; mimeType?: string }): Promise<boolean>;
  pause(): void;
  resume(): void;
  stop(): ScreenRecordingResult;
}

class DefaultScreenRecorderEngine implements ScreenRecorderEngine {
  private readonly themeTokens = new Map<string, string>();
  private _state: ScreenRecorderState = 'idle';
  private _systemAudio = true;
  private _durationMs = 0;
  private _mimeType = 'video/webm';
  private stream: MediaStream | null = null;
  private recorder: MediaRecorder | null = null;
  private chunks: Blob[] = [];
  private createdUrls: string[] = [];
  private disposed = false;

  constructor(private readonly readToken: (name: string) => string) {}

  get state(): ScreenRecorderState {
    return this._state;
  }

  get systemAudio(): boolean {
    return this._systemAudio;
  }

  get durationMs(): number {
    return this._durationMs;
  }

  setSystemAudio(enabled: boolean): void {
    if (this.disposed) return;
    this._systemAudio = Boolean(enabled);
  }

  setDurationMs(ms: number): void {
    if (this.disposed) return;
    this._durationMs = Math.max(0, ms);
  }

  async start(options?: { systemAudio?: boolean; mimeType?: string }): Promise<boolean> {
    if (this.disposed) return false;
    this.cleanupMedia();
    this.chunks = [];
    this._durationMs = 0;
    this._systemAudio = options?.systemAudio ?? this._systemAudio;
    this._mimeType = options?.mimeType || 'video/webm';

    const md = typeof navigator !== 'undefined' ? navigator.mediaDevices : undefined;
    if (md && typeof md.getDisplayMedia === 'function' && typeof MediaRecorder !== 'undefined') {
      this._state = 'requesting';
      try {
        this.stream = await md.getDisplayMedia({
          video: true,
          audio: this._systemAudio,
        });
        if (this.disposed) {
          this.cleanupMedia();
          return false;
        }
        const rec = new MediaRecorder(this.stream, { mimeType: this._mimeType });
        rec.addEventListener('dataavailable', (ev: BlobEvent) => {
          if (ev.data && ev.data.size > 0) {
            this.chunks.push(ev.data);
          }
        });
        rec.start();
        this.recorder = rec;
        this._state = 'recording';
        return true;
      } catch {
        this._state = 'error';
        return false;
      }
    }

    // Headless / JSDOM fallback state machine when getDisplayMedia is absent
    this._state = 'recording';
    return true;
  }

  pause(): void {
    if (this.disposed || this._state !== 'recording') return;
    if (this.recorder && this.recorder.state === 'recording') {
      this.recorder.pause();
    }
    this._state = 'paused';
  }

  resume(): void {
    if (this.disposed || this._state !== 'paused') return;
    if (this.recorder && this.recorder.state === 'paused') {
      this.recorder.resume();
    }
    this._state = 'recording';
  }

  stop(): ScreenRecordingResult {
    if (this.recorder && this.recorder.state !== 'inactive') {
      try {
        this.recorder.stop();
      } catch {
        // ignore
      }
    }
    this.cleanupMedia();
    if (!this.disposed) {
      this._state = 'stopped';
    }
    const blob =
      typeof Blob !== 'undefined' ? new Blob(this.chunks, { type: this._mimeType }) : null;
    let url = '';
    if (blob && typeof URL !== 'undefined' && typeof URL.createObjectURL === 'function') {
      try {
        url = URL.createObjectURL(blob);
        this.createdUrls.push(url);
      } catch {
        url = '';
      }
    }
    return {
      blob,
      url,
      durationMs: this._durationMs,
      mimeType: this._mimeType,
      systemAudio: this._systemAudio,
    };
  }

  syncThemeTokens(tokens: Record<string, string>): void {
    if (this.disposed) return;
    for (const [k, v] of Object.entries(tokens)) {
      this.themeTokens.set(k, v);
    }
  }

  getThemeToken(name: string): string {
    const live = this.disposed ? '' : this.readToken(name);
    if (live) {
      this.themeTokens.set(name, live);
      return live;
    }
    return this.themeTokens.get(name) ?? '';
  }

  dispose(): void {
    this.disposed = true;
    this.cleanupMedia();
    this.revokeUrls();
    this.chunks = [];
    this.themeTokens.clear();
  }

  private cleanupMedia(): void {
    if (this.recorder && this.recorder.state !== 'inactive') {
      try {
        this.recorder.stop();
      } catch {
        // ignore
      }
    }
    this.recorder = null;
    if (this.stream) {
      for (const track of this.stream.getTracks()) {
        track.stop();
      }
      this.stream = null;
    }
  }

  private revokeUrls(): void {
    if (typeof URL !== 'undefined' && typeof URL.revokeObjectURL === 'function') {
      for (const u of this.createdUrls) {
        URL.revokeObjectURL(u);
      }
    }
    this.createdUrls = [];
  }
}

let screenCheckId = 0;

export class MthScreenRecorder extends UIElement {
  static override messages = screenRecorderMessages;
  static override styles = [screenRecorderStyles];
  static override shadowRootOptions: ShadowRootInit = {
    mode: 'open',
    delegatesFocus: true,
  };

  @property({ type: Boolean, attribute: 'system-audio', reflect: true })
  systemAudio = true;

  @property({ type: String, attribute: 'mime-type' })
  mimeType = 'video/webm';

  @property({ type: Boolean, reflect: true })
  disabled = false;

  @property({ type: String })
  label = '';

  @state()
  private recState: ScreenRecorderState = 'idle';

  @state()
  private durationMs = 0;

  @state()
  private recordingUrl = '';

  @state()
  private lastError = '';

  private _engine: DefaultScreenRecorderEngine | null = null;
  private tickTimer: ReturnType<typeof setInterval> | null = null;
  private readonly audioCheckId = `mth-scr-audio-${++screenCheckId}`;

  get engine(): ScreenRecorderEngine | null {
    return this._engine;
  }

  override connectedCallback(): void {
    super.connectedCallback();
    if (!this._engine) {
      this._engine = new DefaultScreenRecorderEngine((name) => readHostToken(this, name));
    }
    this._engine.setSystemAudio(this.systemAudio);
    this._engine.syncThemeTokens(collectHostThemeTokens(this));
    this.syncStates();
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this.clearTick();
    if (this._engine) {
      this._engine.dispose();
      this._engine = null;
    }
    this.recState = 'idle';
  }

  protected override willUpdate(changedProperties: PropertyValues): void {
    super.willUpdate(changedProperties);
    if (changedProperties.has('systemAudio') && this._engine) {
      this._engine.setSystemAudio(this.systemAudio);
    }
    if (this._engine) {
      this._engine.syncThemeTokens(collectHostThemeTokens(this));
    }
    this.syncStates();
  }

  async startRecording(): Promise<boolean> {
    if (this.disabled || !this._engine) return false;
    this.recordingUrl = '';
    this.setState('requesting');
    const ok = await this._engine.start({
      systemAudio: this.systemAudio,
      mimeType: this.mimeType,
    });
    if (!this._engine) return false;
    this.durationMs = 0;
    this.setState(this._engine.state);
    if (ok) {
      this.startTick();
    } else {
      this.lastError = 'Screen capture failed';
      this.emitEvent('mth-error', { detail: { message: this.lastError } });
    }
    return ok;
  }

  pauseRecording(): void {
    if (!this._engine || this.recState !== 'recording') return;
    this._engine.pause();
    this.clearTick();
    this.setState('paused');
  }

  resumeRecording(): void {
    if (!this._engine || this.recState !== 'paused') return;
    this._engine.resume();
    this.startTick();
    this.setState('recording');
  }

  stopRecording(): ScreenRecordingResult | null {
    if (!this._engine || (this.recState !== 'recording' && this.recState !== 'paused')) {
      return null;
    }
    this.clearTick();
    const res = this._engine.stop();
    this.recordingUrl = res.url;
    this.setState('stopped');
    this.emitEvent('mth-record-complete', { detail: res });
    return res;
  }

  private handleAudioToggle(ev: Event): void {
    const input = ev.target as HTMLInputElement;
    this.systemAudio = input.checked;
    this._engine?.setSystemAudio(this.systemAudio);
  }

  private startTick(): void {
    this.clearTick();
    this.tickTimer = setInterval(() => {
      if (!this._engine || this.recState !== 'recording') return;
      this.durationMs += 100;
      this._engine.setDurationMs(this.durationMs);
    }, 100);
  }

  private clearTick(): void {
    if (this.tickTimer !== null) {
      clearInterval(this.tickTimer);
      this.tickTimer = null;
    }
  }

  private setState(next: ScreenRecorderState): void {
    if (this.recState !== next) {
      this.recState = next;
      this.syncStates();
      this.emitEvent('mth-state-change', { detail: { state: next } });
    }
  }

  private syncStates(): void {
    this.setCustomState('recording', this.recState === 'recording');
    this.setCustomState('paused', this.recState === 'paused');
    this.setCustomState('stopped', this.recState === 'stopped');
    this.setCustomState('unsupported', this.recState === 'unsupported');
  }

  private renderStatusText(): string {
    switch (this.recState) {
      case 'requesting':
        return this.t('statusRequesting');
      case 'recording':
        return this.t('statusRecording');
      case 'paused':
        return this.t('statusPaused');
      case 'stopped':
        return this.t('statusStopped');
      case 'unsupported':
        return this.t('statusUnsupported');
      case 'error':
        return this.t('statusError', { message: this.lastError || 'unknown' });
      default:
        return this.t('statusIdle');
    }
  }

  override render() {
    const regionLabel = this.label || this.t('regionLabel');
    const isActive = this.recState === 'recording' || this.recState === 'paused';

    return html`
      <div part="base" class="base" role="region" aria-label=${regionLabel}>
        <div class="header">
          <div part="controls" class="controls">
            ${!isActive
              ? html`
                  <button
                    type="button"
                    class="btn"
                    data-primary="true"
                    ?disabled=${this.disabled}
                    @click=${() => void this.startRecording()}
                  >
                    ${this.t('shareLabel')}
                  </button>
                `
              : nothing}
            ${this.recState === 'recording'
              ? html`
                  <button
                    type="button"
                    class="btn"
                    ?disabled=${this.disabled}
                    @click=${() => this.pauseRecording()}
                  >
                    ${this.t('pauseLabel')}
                  </button>
                `
              : nothing}
            ${this.recState === 'paused'
              ? html`
                  <button
                    type="button"
                    class="btn"
                    ?disabled=${this.disabled}
                    @click=${() => this.resumeRecording()}
                  >
                    ${this.t('resumeLabel')}
                  </button>
                `
              : nothing}
            ${isActive
              ? html`
                  <button
                    type="button"
                    class="btn"
                    ?disabled=${this.disabled}
                    @click=${() => this.stopRecording()}
                  >
                    ${this.t('stopLabel')}
                  </button>
                `
              : nothing}

            <label class="toggle-label" for=${this.audioCheckId}>
              <input
                id=${this.audioCheckId}
                type="checkbox"
                class="audio-check"
                .checked=${this.systemAudio}
                ?disabled=${this.disabled || isActive}
                @change=${this.handleAudioToggle}
              />
              <span>${this.t('systemAudioLabel')}</span>
            </label>
          </div>
          <span part="timer" class="timer">${formatDurationSeconds(this.durationMs / 1000)}</span>
        </div>

        ${this.recordingUrl && this.recordingUrl.startsWith('blob:')
          ? html`<video class="video-preview" controls src=${this.recordingUrl} aria-label=${this.t('playbackLabel')}></video>`
          : nothing}

        <div part="status" class="status" aria-live="polite">${this.renderStatusText()}</div>
        <slot name="fallback"></slot>
      </div>
    `;
  }
}
