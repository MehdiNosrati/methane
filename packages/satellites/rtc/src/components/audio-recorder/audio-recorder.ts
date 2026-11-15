import {
  html,
  nothing,
  property,
  registerLocaleMessages,
  state,
  UIElement,
  type PropertyValues,
} from '@methane-ui/core';
import {
  collectHostThemeTokens,
  createAdoptedSheet,
  formatDurationSeconds,
  readHostToken,
  removeAdoptedSheet,
  type ThemeTokenEngine,
} from '../../shared/satellite-helpers.js';
import { audioRecorderMessages } from './audio-recorder.messages.js';
import { audioRecorderStyles } from './audio-recorder.styles.js';

registerLocaleMessages('en', 'mth-audio-recorder', audioRecorderMessages);

export type AudioRecorderState =
  | 'idle'
  | 'recording'
  | 'paused'
  | 'stopped'
  | 'unsupported'
  | 'error';

export interface AudioRecordingResult {
  readonly blob: Blob | null;
  readonly url: string;
  readonly durationMs: number;
  readonly mimeType: string;
}

export interface AudioRecorderEngine extends ThemeTokenEngine {
  readonly state: AudioRecorderState;
  readonly durationMs: number;
  readonly level: number;
  start(mimeType?: string): Promise<boolean>;
  pause(): void;
  resume(): void;
  stop(): AudioRecordingResult;
  reset(): void;
}

class DefaultAudioRecorderEngine implements AudioRecorderEngine {
  private readonly themeTokens = new Map<string, string>();
  private _state: AudioRecorderState = 'idle';
  private _durationMs = 0;
  private _level = 0;
  private _mimeType = 'audio/webm';
  private stream: MediaStream | null = null;
  private recorder: MediaRecorder | null = null;
  private chunks: Blob[] = [];
  private createdUrls: string[] = [];
  private disposed = false;

  constructor(private readonly readToken: (name: string) => string) {}

  get state(): AudioRecorderState {
    return this._state;
  }

  get durationMs(): number {
    return this._durationMs;
  }

  get level(): number {
    return this._level;
  }

  setDurationMs(ms: number): void {
    if (this.disposed) return;
    this._durationMs = Math.max(0, ms);
  }

  setLevel(level: number): void {
    if (this.disposed) return;
    this._level = Number.isFinite(level) ? Math.min(1, Math.max(0, level)) : 0;
  }

  async start(mimeType = 'audio/webm'): Promise<boolean> {
    if (this.disposed) return false;
    this.cleanupMedia();
    this.chunks = [];
    this._durationMs = 0;
    this._mimeType = mimeType || 'audio/webm';

    const md = typeof navigator !== 'undefined' ? navigator.mediaDevices : undefined;
    if (md && typeof md.getUserMedia === 'function' && typeof MediaRecorder !== 'undefined') {
      try {
        this.stream = await md.getUserMedia({ audio: true, video: false });
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

    // Graceful deterministic fallback state machine when MediaRecorder/MediaDevices is absent
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

  stop(): AudioRecordingResult {
    if (this.recorder && this.recorder.state !== 'inactive') {
      try {
        this.recorder.stop();
      } catch {
        // Ignore already-stopped recorder
      }
    }
    this.cleanupMedia();
    if (!this.disposed) {
      this._state = 'stopped';
    }
    this._level = 0;
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
    };
  }

  reset(): void {
    this.cleanupMedia();
    this.revokeUrls();
    this.chunks = [];
    this._durationMs = 0;
    this._level = 0;
    if (!this.disposed) {
      this._state = 'idle';
    }
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

export class MthAudioRecorder extends UIElement {
  static override messages = audioRecorderMessages;
  static override styles = [audioRecorderStyles];
  static override shadowRootOptions: ShadowRootInit = {
    mode: 'open',
    delegatesFocus: true,
  };

  @property({ type: String, attribute: 'mime-type' })
  mimeType = 'audio/webm';

  @property({ type: Number, attribute: 'max-duration' })
  maxDuration = 0;

  @property({ type: Boolean, reflect: true })
  disabled = false;

  @property({ type: String })
  label = '';

  @state()
  private recState: AudioRecorderState = 'idle';

  @state()
  private durationMs = 0;

  @state()
  private level = 0;

  @state()
  private recordingUrl = '';

  @state()
  private lastError = '';

  private _engine: DefaultAudioRecorderEngine | null = null;
  private meterSheet: CSSStyleSheet | null = null;
  private tickTimer: ReturnType<typeof setInterval> | null = null;

  get engine(): AudioRecorderEngine | null {
    return this._engine;
  }

  override connectedCallback(): void {
    super.connectedCallback();
    if (!this._engine) {
      this._engine = new DefaultAudioRecorderEngine((name) => readHostToken(this, name));
    }
    this._engine.syncThemeTokens(collectHostThemeTokens(this));
    this.syncStates();
    if (this.hasUpdated) {
      this.requestUpdate();
    }
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this.clearTick();
    if (this._engine) {
      this._engine.dispose();
      this._engine = null;
    }
    removeAdoptedSheet(this, this.meterSheet);
    this.meterSheet = null;
    this.recState = 'idle';
  }

  protected override willUpdate(changedProperties: PropertyValues): void {
    super.willUpdate(changedProperties);
    if (this._engine) {
      this._engine.syncThemeTokens(collectHostThemeTokens(this));
    }
    this.syncStates();
  }

  protected override updated(): void {
    this.syncMeterSheet();
  }

  async startRecording(): Promise<boolean> {
    if (this.disabled || !this._engine) return false;
    this.recordingUrl = '';
    const ok = await this._engine.start(this.mimeType);
    if (!this._engine) return false;
    this.durationMs = 0;
    this.setState(this._engine.state);
    if (ok) {
      this.startTick();
    } else {
      this.lastError = this.t('micFailedError');
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

  stopRecording(): AudioRecordingResult | null {
    if (!this._engine || (this.recState !== 'recording' && this.recState !== 'paused')) {
      return null;
    }
    this.clearTick();
    const res = this._engine.stop();
    this.level = 0;
    this.recordingUrl = res.url;
    this.setState('stopped');
    this.emitEvent('mth-record-complete', { detail: res });
    return res;
  }

  resetRecording(): void {
    if (!this._engine) return;
    this.clearTick();
    this._engine.reset();
    this.durationMs = 0;
    this.level = 0;
    this.recordingUrl = '';
    this.setState('idle');
  }

  updateInputLevel(nextLevel: number): void {
    const clamped = Number.isFinite(nextLevel) ? Math.min(1, Math.max(0, nextLevel)) : 0;
    this.level = clamped;
    this._engine?.setLevel(clamped);
    this.emitEvent('mth-level', { detail: { level: clamped } });
  }

  private startTick(): void {
    this.clearTick();
    this.tickTimer = setInterval(() => {
      if (!this._engine || this.recState !== 'recording') return;
      this.durationMs += 100;
      this._engine.setDurationMs(this.durationMs);
      if (this.maxDuration > 0 && this.durationMs >= this.maxDuration * 1000) {
        this.stopRecording();
      }
    }, 100);
  }

  private clearTick(): void {
    if (this.tickTimer !== null) {
      clearInterval(this.tickTimer);
      this.tickTimer = null;
    }
  }

  private setState(next: AudioRecorderState): void {
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

  private syncMeterSheet(): void {
    if (!this.shadowRoot) return;
    if (!this.meterSheet) {
      this.meterSheet = createAdoptedSheet(this);
    }
    if (!this.meterSheet) return;
    const pct = Math.round((Number.isFinite(this.level) ? Math.min(1, Math.max(0, this.level)) : 0) * 100);
    this.meterSheet.replaceSync(`:host { --_meter-pct: ${pct}%; }`);
  }

  private renderStatusText(): string {
    switch (this.recState) {
      case 'recording':
        return this.t('statusRecording');
      case 'paused':
        return this.t('statusPaused');
      case 'stopped':
        return this.t('statusStopped');
      case 'unsupported':
        return this.t('statusUnsupported');
      case 'error':
        return this.t('statusError', { message: this.lastError || this.t('unknownError') });
      default:
        return this.t('statusIdle');
    }
  }

  override render() {
    const regionLabel = this.label || this.t('regionLabel');
    const meterPct = Math.round(this.level * 100);
    const isActive = this.recState === 'recording' || this.recState === 'paused';

    return html`
      <div part="base" class="base" role="region" aria-label=${regionLabel}>
        <div class="top-row">
          <div part="controls" class="controls">
            ${!isActive
              ? html`
                  <button
                    type="button"
                    class="btn"
                    data-role="record"
                    ?disabled=${this.disabled}
                    @click=${() => void this.startRecording()}
                  >
                    ${this.t('recordLabel')}
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
            ${this.recState === 'stopped'
              ? html`
                  <button
                    type="button"
                    class="btn"
                    ?disabled=${this.disabled}
                    @click=${() => this.resetRecording()}
                  >
                    ${this.t('resetLabel')}
                  </button>
                `
              : nothing}
          </div>
          <span part="timer" class="timer">${formatDurationSeconds(this.durationMs / 1000)}</span>
        </div>

        <div
          part="meter"
          class="meter"
          role="meter"
          aria-label=${this.t('meterLabel')}
          aria-valuemin="0"
          aria-valuemax="100"
          aria-valuenow=${String(meterPct)}
        >
          <div class="meter-fill"></div>
        </div>

        ${this.recordingUrl && this.recordingUrl.startsWith('blob:')
          ? html`<audio class="audio-preview" controls src=${this.recordingUrl} aria-label=${this.t('playbackLabel')}></audio>`
          : nothing}

        <div part="status" class="status" aria-live="polite">${this.renderStatusText()}</div>
        <slot name="fallback"></slot>
      </div>
    `;
  }
}
