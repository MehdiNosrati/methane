import {
  html,
  nothing,
  property,
  registerLocaleMessages,
  UIElement,
  type PropertyValues,
} from '@methane/core';
import { RovingFocusController } from '@methane/primitives';
import {
  collectHostThemeTokens,
  createAdoptedSheet,
  readHostToken,
  type ThemeTokenEngine,
} from '../../shared/satellite-helpers.js';
import { videoGridMessages } from './video-grid.messages.js';
import { videoGridStyles } from './video-grid.styles.js';

registerLocaleMessages('en', 'mth-video-grid', videoGridMessages);

export interface VideoParticipant {
  readonly id: string;
  readonly name: string;
  readonly muted?: boolean;
  readonly videoOff?: boolean;
  readonly speaking?: boolean;
  readonly pinned?: boolean;
  readonly stream?: MediaStream | null;
}

export type VideoGridLayout = 'gallery' | 'speaker';

export interface VideoGridEngine extends ThemeTokenEngine {
  readonly layout: VideoGridLayout;
  readonly pinnedId: string;
  readonly activeSpeakerId: string;
  readonly participantCount: number;
  setLayout(layout: VideoGridLayout): void;
  pinParticipant(id: string): void;
  getSpotlightParticipant(): VideoParticipant | null;
}

class DefaultVideoGridEngine implements VideoGridEngine {
  private readonly themeTokens = new Map<string, string>();
  private readonly attachedVideos = new Set<HTMLVideoElement>();
  private participantsList: ReadonlyArray<VideoParticipant> = [];
  private _layout: VideoGridLayout = 'gallery';
  private _pinnedId = '';
  private _activeSpeakerId = '';
  private disposed = false;

  constructor(private readonly readToken: (name: string) => string) {}

  get layout(): VideoGridLayout {
    return this._layout;
  }

  get pinnedId(): string {
    return this._pinnedId;
  }

  get activeSpeakerId(): string {
    return this._activeSpeakerId;
  }

  get participantCount(): number {
    return this.participantsList.length;
  }

  syncState(
    participants: ReadonlyArray<VideoParticipant>,
    layout: VideoGridLayout,
    pinnedId: string,
    activeSpeakerId: string,
  ): void {
    if (this.disposed) return;
    this.participantsList = participants;
    this._layout = layout;
    this._pinnedId = pinnedId;
    this._activeSpeakerId = activeSpeakerId;
  }

  setLayout(layout: VideoGridLayout): void {
    if (this.disposed) return;
    this._layout = layout;
  }

  pinParticipant(id: string): void {
    if (this.disposed) return;
    this._pinnedId = this._pinnedId === id ? '' : id;
  }

  getSpotlightParticipant(): VideoParticipant | null {
    if (this.participantsList.length === 0) return null;
    if (this._pinnedId) {
      const pinned = this.participantsList.find((p) => p.id === this._pinnedId);
      if (pinned) return pinned;
    }
    if (this._activeSpeakerId) {
      const active = this.participantsList.find((p) => p.id === this._activeSpeakerId);
      if (active) return active;
    }
    const speaking = this.participantsList.find((p) => p.speaking);
    return speaking ?? this.participantsList[0] ?? null;
  }

  bindStreams(root: ShadowRoot | null): void {
    if (this.disposed || !root) return;
    const videos = root.querySelectorAll<HTMLVideoElement>('video[data-participant-id]');
    for (const videoEl of videos) {
      const id = videoEl.dataset.participantId;
      const participant = this.participantsList.find((p) => p.id === id);
      const stream = participant?.stream ?? null;
      if ('srcObject' in videoEl && videoEl.srcObject !== stream) {
        videoEl.srcObject = stream;
      }
      this.attachedVideos.add(videoEl);
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
    for (const videoEl of this.attachedVideos) {
      if ('srcObject' in videoEl) {
        videoEl.srcObject = null;
      }
    }
    this.attachedVideos.clear();
    this.themeTokens.clear();
  }
}

export class MthVideoGrid extends UIElement {
  static override messages = videoGridMessages;
  static override styles = [videoGridStyles];
  static override shadowRootOptions: ShadowRootInit = {
    mode: 'open',
    delegatesFocus: true,
  };

  @property({ attribute: false })
  participants: ReadonlyArray<VideoParticipant> = [];

  @property({ type: String, reflect: true })
  layout: VideoGridLayout = 'gallery';

  @property({ type: String, attribute: 'pinned-id' })
  pinnedId = '';

  @property({ type: String, attribute: 'active-speaker-id' })
  activeSpeakerId = '';

  @property({ type: Number })
  columns = 0;

  @property({ type: String })
  label = '';

  private _engine: DefaultVideoGridEngine | null = null;
  private readonly rovingCtrl: RovingFocusController;
  private gridSheet: CSSStyleSheet | null = null;

  constructor() {
    super();
    this.rovingCtrl = new RovingFocusController(this, {
      orientation: 'horizontal',
      loop: true,
      getItems: () => this.getFocusableControls(),
    });
  }

  get engine(): VideoGridEngine | null {
    return this._engine;
  }

  override connectedCallback(): void {
    super.connectedCallback();
    if (!this._engine) {
      this._engine = new DefaultVideoGridEngine((name) => readHostToken(this, name));
    }
    this._engine.syncThemeTokens(collectHostThemeTokens(this));
    this._engine.syncState(this.participants, this.layout, this.pinnedId, this.activeSpeakerId);
    this.syncHostStates();
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    if (this._engine) {
      this._engine.dispose();
      this._engine = null;
    }
    this.gridSheet = null;
  }

  protected override willUpdate(changedProperties: PropertyValues): void {
    super.willUpdate(changedProperties);
    if (changedProperties.has('layout') || changedProperties.has('participants')) {
      this.syncHostStates();
    }
    if (this._engine) {
      this._engine.syncState(this.participants, this.layout, this.pinnedId, this.activeSpeakerId);
      this._engine.syncThemeTokens(collectHostThemeTokens(this));
    }
  }

  protected override updated(changedProperties: PropertyValues): void {
    super.updated(changedProperties);
    this.syncColumnsSheet();
    this._engine?.bindStreams(this.shadowRoot);
    this.rovingCtrl.syncTabIndices();
  }

  getFocusableControls(): HTMLElement[] {
    return Array.from(this.shadowRoot?.querySelectorAll<HTMLElement>('[data-roving-item="true"]') ?? []);
  }

  setLayout(nextLayout: VideoGridLayout): void {
    if (this.layout === nextLayout) return;
    this.layout = nextLayout;
    this._engine?.setLayout(nextLayout);
    this.emitEvent('mth-layout-change', { detail: { layout: nextLayout } });
  }

  togglePin(participantId: string): void {
    const nextPinned = this.pinnedId === participantId ? '' : participantId;
    this.pinnedId = nextPinned;
    this._engine?.pinParticipant(participantId);
    this.emitEvent('mth-pin-change', { detail: { pinnedId: nextPinned } });
  }

  private syncHostStates(): void {
    this.setCustomState('speaker-layout', this.layout === 'speaker');
    this.setCustomState('gallery-layout', this.layout === 'gallery');
    this.setCustomState('empty', this.participants.length === 0);
  }

  private syncColumnsSheet(): void {
    if (!this.shadowRoot) return;
    if (!this.gridSheet) {
      this.gridSheet = createAdoptedSheet(this);
    }
    if (!this.gridSheet) return;
    const cols = Number.isFinite(this.columns) ? Math.floor(this.columns) : 0;
    const clamped = cols >= 1 && cols <= 12 ? `repeat(${cols}, minmax(0, 1fr))` : 'repeat(auto-fit, minmax(12rem, 1fr))';
    this.gridSheet.replaceSync(`:host { --_cols: ${clamped}; }`);
  }

  private renderParticipantTile(p: VideoParticipant, isStage = false) {
    const isPinned = this.pinnedId === p.id || Boolean(p.pinned && !this.pinnedId);
    const isSpeaking = Boolean(p.speaking || this.activeSpeakerId === p.id);
    const pinText = isPinned
      ? this.t('unpinLabel', { name: p.name })
      : this.t('pinLabel', { name: p.name });
    const initials = p.name.trim().slice(0, 2).toUpperCase() || '?';

    return html`
      <article
        part=${isStage ? 'stage' : 'tile'}
        class=${isStage ? 'stage' : 'tile'}
        data-participant-id=${p.id}
        data-speaking=${isSpeaking ? 'true' : 'false'}
      >
        ${p.videoOff
          ? html`<div class="avatar-placeholder" aria-label=${this.t('videoOffLabel')}>${initials}</div>`
          : html`
              <video
                class="video-el"
                data-participant-id=${p.id}
                autoplay
                playsinline
                muted
                aria-label=${p.name}
              ></video>
            `}
        <div class="tile-footer">
          <span class="participant-name">${p.name}</span>
          <div class="badges">
            <span class="badge" data-state=${p.muted ? 'muted' : 'live'}>
              ${p.muted ? this.t('mutedLabel') : this.t('unmutedLabel')}
            </span>
            <button
              type="button"
              class="pin-btn"
              data-roving-item="true"
              aria-pressed=${isPinned ? 'true' : 'false'}
              aria-label=${pinText}
              @click=${() => this.togglePin(p.id)}
            >
              ${pinText}
            </button>
          </div>
        </div>
      </article>
    `;
  }

  override render() {
    const regionLabel = this.label || this.t('regionLabel');
    const spotlight = this.layout === 'speaker' ? this._engine?.getSpotlightParticipant() ?? null : null;
    const gridParticipants = spotlight
      ? this.participants.filter((p) => p.id !== spotlight.id)
      : this.participants;

    return html`
      <div part="base" class="base" role="region" aria-label=${regionLabel}>
        <div part="toolbar" class="toolbar">
          <div class="layout-group">
            <button
              type="button"
              class="layout-btn"
              aria-pressed=${this.layout === 'gallery' ? 'true' : 'false'}
              @click=${() => this.setLayout('gallery')}
            >
              ${this.t('galleryLayoutLabel')}
            </button>
            <button
              type="button"
              class="layout-btn"
              aria-pressed=${this.layout === 'speaker' ? 'true' : 'false'}
              @click=${() => this.setLayout('speaker')}
            >
              ${this.t('speakerLayoutLabel')}
            </button>
          </div>
        </div>

        ${this.participants.length === 0
          ? html`
              <div class="empty">
                <slot name="fallback">${this.t('emptyText')}</slot>
              </div>
            `
          : html`
              ${spotlight ? this.renderParticipantTile(spotlight, true) : nothing}
              <div part="grid" class="grid">
                ${gridParticipants.map((p) => this.renderParticipantTile(p, false))}
              </div>
              <slot name="fallback"></slot>
            `}
      </div>
    `;
  }
}
