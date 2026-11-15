import { html, nothing, property, query, state, UIElement, type PropertyValues, type TemplateResult } from '@methane/core';
import { ObserverPoolController } from '@methane/primitives';
import type { StyleSpecification } from 'maplibre-gl';
import { createMapEngine, type LngLatTuple, type MapEngineHandle } from '../shared/map-engine.js';
import { mapMessages } from './map.messages.js';
import { mapStyles } from './map.styles.js';

export interface MapMarker {
  readonly id: string;
  readonly lng: number;
  readonly lat: number;
  readonly label?: string;
}

export class MthMap extends UIElement {
  static override styles = mapStyles;
  static override messages = mapMessages;

  @property({ type: Number, attribute: 'center-lat' }) centerLat = 37.7749;
  @property({ type: Number, attribute: 'center-lng' }) centerLng = -122.4194;
  @property({ type: Number }) zoom = 11;
  @property({ type: Number, attribute: 'min-zoom' }) minZoom = 0;
  @property({ type: Number, attribute: 'max-zoom' }) maxZoom = 22;
  @property({ type: Number }) bearing = 0;
  @property({ type: Number }) pitch = 0;
  @property({ type: Boolean }) interactive = true;
  @property({ type: String }) label = '';
  @property({ attribute: false }) mapStyle: string | StyleSpecification | undefined = undefined;
  @property({ attribute: false }) markers: ReadonlyArray<MapMarker> = [];

  @state() private viewCenter: LngLatTuple = [-122.4194, 37.7749];
  @state() private viewZoom = 11;

  @query('.canvas') private canvasEl?: HTMLElement | null;

  private _engine: MapEngineHandle | null = null;
  private readonly observerCtrl = new ObserverPoolController(this);
  private observedCanvasEl: HTMLElement | null = null;

  get engine(): MapEngineHandle | null {
    return this._engine;
  }

  private get isRtl(): boolean {
    return (this.closest('[dir]')?.getAttribute('dir')?.toLowerCase() ?? this.resolvedDir) === 'rtl';
  }

  private syncEngineCanvas(): void {
    if (this._engine && this.canvasEl) {
      this._engine.attachContainer(this.canvasEl);
      this._engine.syncThemeTokens();
      if (this.observedCanvasEl !== this.canvasEl) {
        this.observedCanvasEl = this.canvasEl;
        this.observerCtrl.observeResize(this.canvasEl, () => {
          this._engine?.resize();
        });
      }
    }
  }

  override connectedCallback(): void {
    super.connectedCallback();
    if (!this._engine) {
      this._engine = createMapEngine({
        host: this,
        center: [this.centerLng, this.centerLat],
        zoom: this.zoom,
        minZoom: this.minZoom,
        maxZoom: this.maxZoom,
        bearing: this.bearing,
        pitch: this.pitch,
        interactive: this.interactive,
        ...(this.mapStyle !== undefined ? { style: this.mapStyle } : {}),
      });
      this.viewCenter = this._engine.center;
      this.viewZoom = this._engine.zoom;
    }
    this.setCustomState('interactive', this.interactive);
    if (this.hasUpdated) {
      this.syncEngineCanvas();
    }
  }

  override disconnectedCallback(): void {
    this.observedCanvasEl = null;
    if (this._engine) {
      this._engine.remove();
      this._engine = null;
    }
    super.disconnectedCallback();
  }

  protected override willUpdate(changed: PropertyValues): void {
    super.willUpdate(changed);
    if (changed.has('interactive')) {
      this.setCustomState('interactive', this.interactive);
    }
    if (this._engine && changed.has('mapStyle')) {
      this._engine.setStyle(this.mapStyle);
    }
    if (
      this._engine &&
      (changed.has('centerLat') ||
        changed.has('centerLng') ||
        changed.has('zoom') ||
        changed.has('bearing') ||
        changed.has('pitch'))
    ) {
      this._engine.setView({
        center: [this.centerLng, this.centerLat],
        zoom: this.zoom,
        bearing: this.bearing,
        pitch: this.pitch,
      });
      this.viewCenter = this._engine.center;
      this.viewZoom = this._engine.zoom;
    }
  }

  protected override updated(changed: PropertyValues): void {
    super.updated(changed);
    this.syncEngineCanvas();
  }

  zoomIn(): void {
    if (!this.interactive || !this._engine) return;
    this._engine.zoomBy(1);
    this.syncFromEngine();
  }

  zoomOut(): void {
    if (!this.interactive || !this._engine) return;
    this._engine.zoomBy(-1);
    this.syncFromEngine();
  }

  panBy(dx: number, dy: number): void {
    if (!this.interactive || !this._engine) return;
    this._engine.panBy(dx, dy);
    this.syncFromEngine();
  }

  resetView(): void {
    if (!this.interactive || !this._engine) return;
    this._engine.setView({
      center: [this.centerLng, this.centerLat],
      zoom: this.zoom,
      bearing: this.bearing,
      pitch: this.pitch,
    });
    this.syncFromEngine();
  }

  private syncFromEngine(): void {
    if (!this._engine) return;
    this.viewCenter = this._engine.center;
    this.viewZoom = this._engine.zoom;
    this.emitEvent('mth-map-move', {
      detail: {
        center: this.viewCenter,
        zoom: this.viewZoom,
      },
    });
  }

  private handleKeydown(event: KeyboardEvent): void {
    if (!this.interactive) return;
    const step = 64;
    const dirSign = this.isRtl ? -1 : 1;
    switch (event.key) {
      case 'ArrowLeft':
        event.preventDefault();
        this.panBy(-step * dirSign, 0);
        break;
      case 'ArrowRight':
        event.preventDefault();
        this.panBy(step * dirSign, 0);
        break;
      case 'ArrowUp':
        event.preventDefault();
        this.panBy(0, -step);
        break;
      case 'ArrowDown':
        event.preventDefault();
        this.panBy(0, step);
        break;
      case '+':
      case '=':
        event.preventDefault();
        this.zoomIn();
        break;
      case '-':
        event.preventDefault();
        this.zoomOut();
        break;
      case 'Home':
      case '0':
        event.preventDefault();
        this.resetView();
        break;
      default:
        break;
    }
  }

  private handleMarkerClick(marker: MapMarker): void {
    this._engine?.setView({ center: [marker.lng, marker.lat] });
    this.syncFromEngine();
    this.emitEvent('mth-marker-select', {
      detail: {
        id: marker.id,
        lng: marker.lng,
        lat: marker.lat,
        label: marker.label ?? marker.id,
      },
    });
  }

  protected override render(): TemplateResult {
    const regionLabel = this.label || this.t('regionLabel');
    const summaryText = this.t('statusSummary', {
      lat: this.viewCenter[1].toFixed(4),
      lng: this.viewCenter[0].toFixed(4),
      zoom: this.viewZoom.toFixed(1),
    });

    return html`
      <div
        class="base"
        part="base"
        role="region"
        aria-label=${regionLabel}
        tabindex=${this.interactive ? '0' : nothing}
        @keydown=${this.handleKeydown}
      >
        <div class="canvas" part="canvas" aria-hidden="true"></div>
        <div class="fallback-layer">
          <slot name="fallback"></slot>
        </div>
        <div class="overlay">
          <div class="markers">
            ${this.markers.map((marker) => {
              const markerLabel = marker.label
                ? this.t('markerLabel', { label: marker.label })
                : this.t('unnamedMarker', { id: marker.id });
              return html`
                <button
                  type="button"
                  class="marker-btn"
                  part="marker"
                  aria-label=${markerLabel}
                  @click=${() => this.handleMarkerClick(marker)}
                >
                  ${marker.label ?? marker.id}
                </button>
              `;
            })}
            <slot></slot>
          </div>
          <div class="controls" part="controls" role="group" aria-label=${this.t('controlsLabel')}>
            <button
              type="button"
              class="control-btn"
              aria-label=${this.t('zoomIn')}
              ?disabled=${!this.interactive}
              @click=${() => this.zoomIn()}
            >
              +
            </button>
            <button
              type="button"
              class="control-btn"
              aria-label=${this.t('zoomOut')}
              ?disabled=${!this.interactive}
              @click=${() => this.zoomOut()}
            >
              -
            </button>
            <button
              type="button"
              class="control-btn"
              aria-label=${this.t('resetView')}
              ?disabled=${!this.interactive}
              @click=${() => this.resetView()}
            >
              0
            </button>
          </div>
        </div>
        <div class="status" part="status" aria-live="polite">${summaryText}</div>
      </div>
    `;
  }
}
