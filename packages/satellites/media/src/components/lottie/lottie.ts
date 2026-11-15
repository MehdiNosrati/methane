import {
  html,
  nothing,
  property,
  query,
  registerLocaleMessages,
  state,
  UIElement,
  type PropertyValues,
} from '@methane-ui/core';
import type { DotLottie, Config as DotLottieConfig } from '@lottiefiles/dotlottie-web';
import { MotionController } from '@methane-ui/primitives';
import {
  collectHostThemeTokens,
  isSafeMediaUrl,
  readHostToken,
  type ThemeTokenEngine,
} from '../../shared/satellite-helpers.js';
import { LottieMessages } from './lottie.messages.js';
import { lottieStyles } from './lottie.styles.js';

registerLocaleMessages('en', 'mth-lottie', LottieMessages);

export interface LottieEngineConfig {
  canvas: HTMLCanvasElement;
  src: string;
  data?: DotLottieConfig['data'];
  autoplay: boolean;
  loop: boolean;
  speed: number;
  reducedMotion: boolean;
}

export class LottieEngine implements ThemeTokenEngine {
  private readonly tokens = new Map<string, string>();
  private player: DotLottie | null = null;
  private _playing = false;
  private _frozen = false;
  private _disposed = false;
  private _speed = 1;
  private _loop = true;
  private tokenLookup: ((name: string) => string) | null;

  constructor(tokenLookup?: (name: string) => string) {
    this.tokenLookup = tokenLookup ?? null;
  }

  get nativePlayer(): DotLottie | null {
    return this.player;
  }

  get playing(): boolean {
    return this._playing;
  }

  get frozen(): boolean {
    return this._frozen;
  }

  get disposed(): boolean {
    return this._disposed;
  }

  async mountCanvas(config: LottieEngineConfig): Promise<boolean> {
    if (this._disposed) return false;
    this._loop = config.loop;
    this._speed = config.speed;
    this._frozen = config.reducedMotion;

    if (!this.canCreateNativePlayer(config.canvas) || (!config.src && !config.data)) {
      this._playing = config.autoplay && !config.reducedMotion;
      return false;
    }

    try {
      this.destroyNativePlayer();
      const { DotLottie: DotLottieCtor } = await import('@lottiefiles/dotlottie-web');
      if (this._disposed) return false;
      const playerConfig: DotLottieConfig = {
        canvas: config.canvas,
        autoplay: config.autoplay && !config.reducedMotion,
        loop: config.loop,
        speed: config.speed,
        ...(config.src ? { src: config.src } : {}),
        ...(config.data !== undefined ? { data: config.data } : {}),
      };
      this.player = new DotLottieCtor(playerConfig);
      if (config.reducedMotion) {
        this.player.freeze();
        this._playing = false;
      } else {
        this._playing = config.autoplay;
      }
      return true;
    } catch {
      this.player = null;
      return false;
    }
  }

  play(): boolean {
    if (this._disposed || this._frozen) return false;
    this._playing = true;
    this.player?.unfreeze();
    this.player?.play();
    return true;
  }

  pause(): void {
    this._playing = false;
    this.player?.pause();
  }

  stop(): void {
    this._playing = false;
    this.player?.stop();
  }

  setReducedMotion(reduced: boolean): void {
    this._frozen = reduced;
    if (reduced) {
      this._playing = false;
      this.player?.freeze();
    }
  }

  setPlaybackParams(speed: number, loop: boolean): void {
    this._speed = speed;
    this._loop = loop;
    this.player?.setSpeed(this._speed);
    this.player?.setLoop(this._loop);
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
    this._playing = false;
    this.tokenLookup = null;
    this.destroyNativePlayer();
    this.tokens.clear();
  }

  private canCreateNativePlayer(canvas: HTMLCanvasElement): boolean {
    if (
      typeof WebAssembly === 'undefined' ||
      typeof CanvasRenderingContext2D === 'undefined'
    ) {
      return false;
    }
    try {
      return canvas.getContext('2d') !== null;
    } catch {
      return false;
    }
  }

  private destroyNativePlayer(): void {
    if (this.player) {
      try {
        this.player.destroy();
      } catch {
        // Ignore teardown errors on already-detached canvases.
      }
      this.player = null;
    }
  }
}

export class MthLottie extends UIElement {
  static override styles = lottieStyles;
  static override messages = LottieMessages;
  static override shadowRootOptions: ShadowRootInit = {
    ...UIElement.shadowRootOptions,
    delegatesFocus: true,
  };

  @property({ type: String })
  src = '';

  @property({ type: Boolean, reflect: true })
  autoplay = false;

  @property({ type: Boolean, reflect: true })
  loop = true;

  @property({ type: Number })
  speed = 1;

  @property({ type: Boolean, reflect: true })
  playing = false;

  @property({ type: Boolean, reflect: true })
  controls = true;

  @property({ type: Boolean, reflect: true })
  disabled = false;

  @property({ type: String })
  label = '';

  @property({ attribute: false })
  animationData: DotLottieConfig['data'] | undefined = undefined;

  @state()
  private errorMessage = '';

  @query('[part="canvas"]')
  private canvasEl?: HTMLCanvasElement;

  private _engine: LottieEngine | null = null;
  private canvasMounted = false;
  private readonly motion = new MotionController(this, { respectReducedMotion: true });

  get engine(): LottieEngine | null {
    return this._engine;
  }

  override connectedCallback(): void {
    super.connectedCallback();
    this._engine = new LottieEngine((name) => readHostToken(this, name));
    this._engine.syncThemeTokens(collectHostThemeTokens(this));
    this.syncReducedMotionState();
    if (this.hasUpdated) {
      this.requestUpdate();
    }
  }

  override disconnectedCallback(): void {
    this._engine?.dispose();
    this._engine = null;
    this.canvasMounted = false;
    super.disconnectedCallback();
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
    if (!Number.isFinite(this.speed) || this.speed <= 0) {
      this.speed = 1;
    }
    if (this.motion.isReducedMotion) {
      this.playing = false;
    }
  }

  protected override updated(changed: PropertyValues): void {
    super.updated(changed);
    if (changed.has('src') && this.errorMessage) {
      this.emitEvent('mth-error', { detail: { reason: this.errorMessage } });
    }
    if (!this._engine) return;
    this._engine.syncThemeTokens(collectHostThemeTokens(this));
    this.syncReducedMotionState();

    if (
      this.canvasEl &&
      !this.errorMessage &&
      (!this.canvasMounted || changed.has('src') || changed.has('animationData') || changed.has('autoplay'))
    ) {
      this.canvasMounted = true;
      void this._engine.mountCanvas({
        canvas: this.canvasEl,
        src: this.src,
        data: this.animationData,
        autoplay: this.autoplay,
        loop: this.loop,
        speed: this.speed,
        reducedMotion: this.motion.isReducedMotion,
      });
    } else if (changed.has('speed') || changed.has('loop')) {
      this._engine.setPlaybackParams(this.speed, this.loop);
    }

    this.setCustomState('playing', this.playing);
    this.setCustomState('frozen', this.motion.isReducedMotion);
    this.setCustomState('disabled', this.disabled);
  }

  play(): boolean {
    if (this.disabled || this.errorMessage || !this._engine) return false;
    this.syncReducedMotionState();
    const started = this._engine.play();
    this.playing = started;
    if (started) {
      this.emitEvent('mth-play', { detail: { speed: this.speed, loop: this.loop } });
    }
    return started;
  }

  pause(): void {
    this._engine?.pause();
    this.playing = false;
    this.emitEvent('mth-pause', { detail: { speed: this.speed } });
  }

  stop(): void {
    this._engine?.stop();
    this.playing = false;
    this.emitEvent('mth-stop');
  }

  private syncReducedMotionState(): void {
    this._engine?.setReducedMotion(this.motion.isReducedMotion);
  }

  override render() {
    const regionLabel = this.label.trim() || this.t('regionLabel');
    const playLabel = this.playing ? this.t('pauseLabel') : this.t('playLabel');
    const reduced = this.motion.isReducedMotion;

    return html`
      <div part="base" role="region" aria-label=${regionLabel}>
        <canvas part="canvas" aria-hidden="true"></canvas>

        ${this.controls
          ? html`
              <div part="controls">
                <button
                  type="button"
                  part="play-button"
                  ?disabled=${this.disabled || Boolean(this.errorMessage) || reduced}
                  aria-pressed=${this.playing ? 'true' : 'false'}
                  aria-label=${playLabel}
                  @click=${() => (this.playing ? this.pause() : this.play())}
                >
                  ${this.playing ? this.t('pauseLabel') : this.t('playLabel')}
                </button>
                <button
                  type="button"
                  part="stop-button"
                  ?disabled=${this.disabled || Boolean(this.errorMessage)}
                  aria-label=${this.t('stopLabel')}
                  @click=${() => this.stop()}
                >
                  ${this.t('stopLabel')}
                </button>
                ${reduced
                  ? html`<span part="status">${this.t('reducedMotionLabel')}</span>`
                  : nothing}
              </div>
            `
          : nothing}

        ${this.errorMessage
          ? html`<div part="status" role="alert">${this.errorMessage}</div>`
          : nothing}
        <slot name="fallback"></slot>
      </div>
    `;
  }
}
