import { html, property, query, state, svg, UIElement, type PropertyValues, type TemplateResult } from '@methane/core';
import { ObserverPoolController, RovingFocusController } from '@methane/primitives';
import {
  createMapEngine,
  normalizeLngLat,
  type LngLatTuple,
  type MapEngineHandle,
  type MapGeoJsonFeature,
  type MapGeoJsonFeatureCollection,
} from '../shared/map-engine.js';
import { mapDrawMessages } from './map-draw.messages.js';
import { mapDrawStyles } from './map-draw.styles.js';

export type DrawMode = 'select' | 'point' | 'line' | 'polygon';

export class MthMapDraw extends UIElement {
  static override styles = mapDrawStyles;
  static override messages = mapDrawMessages;

  @property({ type: String, reflect: true }) mode: DrawMode = 'point';
  @property({ attribute: false }) features: MapGeoJsonFeatureCollection = {
    type: 'FeatureCollection',
    features: [],
  };
  @property({ type: String }) label = '';
  @property({ type: Boolean, reflect: true }) disabled = false;

  @state() private draftVertices: ReadonlyArray<LngLatTuple> = [];
  @state() private undoStack: ReadonlyArray<MapGeoJsonFeatureCollection> = [];
  @state() private redoStack: ReadonlyArray<MapGeoJsonFeatureCollection> = [];
  @state() private cursorCoord: LngLatTuple = [0, 0];

  @query('.canvas') private canvasEl?: HTMLElement | null;

  private _engine: MapEngineHandle | null = null;
  private readonly observerCtrl = new ObserverPoolController(this);
  private observedCanvasEl: HTMLElement | null = null;
  private featureCounter = 0;
  private readonly rovingCtrl: RovingFocusController;

  constructor() {
    super();
    this.rovingCtrl = new RovingFocusController(this, {
      orientation: 'horizontal',
      loop: true,
      getItems: () => Array.from(this.shadowRoot?.querySelectorAll<HTMLElement>('.tool-btn:not([disabled])') ?? []),
    });
  }

  get engine(): MapEngineHandle | null {
    return this._engine;
  }

  get canUndo(): boolean {
    return this.undoStack.length > 0;
  }

  get canRedo(): boolean {
    return this.redoStack.length > 0;
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
      this._engine = createMapEngine({ host: this });
    }
    this.setCustomState('disabled', this.disabled);
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
    if (changed.has('disabled')) {
      this.setCustomState('disabled', this.disabled);
    }
    this.rovingCtrl.updateOptions({ dir: this.isRtl ? 'rtl' : 'ltr' });
  }

  protected override updated(changed: PropertyValues): void {
    super.updated(changed);
    this.syncEngineCanvas();
  }

  setMode(nextMode: DrawMode): void {
    if (this.disabled || this.mode === nextMode) return;
    this.mode = nextMode;
    this.draftVertices = [];
    this.emitEvent('mth-draw-mode', { detail: { mode: nextMode } });
  }

  addVertex(lng: number, lat: number): void {
    if (this.disabled || this.mode === 'select') return;
    const coord = normalizeLngLat(lng, lat);
    if (this.mode === 'point') {
      this.commitCollection([
        ...this.features.features,
        {
          type: 'Feature',
          id: `feat-${++this.featureCounter}`,
          geometry: { type: 'Point', coordinates: coord },
        },
      ]);
      return;
    }
    this.draftVertices = [...this.draftVertices, coord];
  }

  finishFeature(): void {
    if (this.disabled) return;
    if (this.mode === 'line' && this.draftVertices.length >= 2) {
      const feature: MapGeoJsonFeature = {
        type: 'Feature',
        id: `feat-${++this.featureCounter}`,
        geometry: {
          type: 'LineString',
          coordinates: [...this.draftVertices],
        },
      };
      this.draftVertices = [];
      this.commitCollection([...this.features.features, feature]);
    } else if (this.mode === 'polygon' && this.draftVertices.length >= 3) {
      const ring = [...this.draftVertices, this.draftVertices[0]!];
      const feature: MapGeoJsonFeature = {
        type: 'Feature',
        id: `feat-${++this.featureCounter}`,
        geometry: {
          type: 'Polygon',
          coordinates: [ring],
        },
      };
      this.draftVertices = [];
      this.commitCollection([...this.features.features, feature]);
    }
  }

  undo(): void {
    if (this.disabled || this.undoStack.length === 0) return;
    const previous = this.undoStack[this.undoStack.length - 1]!;
    this.undoStack = this.undoStack.slice(0, -1);
    this.redoStack = [...this.redoStack, this.features];
    this.features = previous;
    this.emitEvent('mth-draw-change', { detail: { features: this.features } });
  }

  redo(): void {
    if (this.disabled || this.redoStack.length === 0) return;
    const next = this.redoStack[this.redoStack.length - 1]!;
    this.redoStack = this.redoStack.slice(0, -1);
    this.undoStack = [...this.undoStack, this.features];
    this.features = next;
    this.emitEvent('mth-draw-change', { detail: { features: this.features } });
  }

  clear(): void {
    if (this.disabled) return;
    this.draftVertices = [];
    this.commitCollection([]);
  }

  private commitCollection(nextFeatures: ReadonlyArray<MapGeoJsonFeature>): void {
    this.undoStack = [...this.undoStack, this.features];
    this.redoStack = [];
    this.features = {
      type: 'FeatureCollection',
      features: nextFeatures,
    };
    this.emitEvent('mth-draw-change', { detail: { features: this.features } });
  }

  private handleSurfaceClick(event: MouseEvent): void {
    if (this.disabled || this.mode === 'select') return;
    const target = event.currentTarget as Element;
    const rect = target.getBoundingClientRect();
    const width = rect.width || 300;
    const height = rect.height || 140;
    const relX = (event.clientX - rect.left) / width - 0.5;
    const relY = 0.5 - (event.clientY - rect.top) / height;
    const baseCenter = this._engine?.center ?? [0, 0];
    this.addVertex(baseCenter[0] + relX * 2, baseCenter[1] + relY * 2);
  }

  private handleSurfaceKeydown(event: KeyboardEvent): void {
    if (this.disabled) return;
    const step = 0.2;
    const rtlFactor = this.isRtl ? -1 : 1;
    switch (event.key) {
      case 'ArrowLeft':
        event.preventDefault();
        event.stopPropagation();
        this.cursorCoord = normalizeLngLat(this.cursorCoord[0] - step * rtlFactor, this.cursorCoord[1]);
        break;
      case 'ArrowRight':
        event.preventDefault();
        event.stopPropagation();
        this.cursorCoord = normalizeLngLat(this.cursorCoord[0] + step * rtlFactor, this.cursorCoord[1]);
        break;
      case 'ArrowUp':
        event.preventDefault();
        event.stopPropagation();
        this.cursorCoord = normalizeLngLat(this.cursorCoord[0], this.cursorCoord[1] + step);
        break;
      case 'ArrowDown':
        event.preventDefault();
        event.stopPropagation();
        this.cursorCoord = normalizeLngLat(this.cursorCoord[0], this.cursorCoord[1] - step);
        break;
      case ' ':
      case 'Spacebar':
        if (this.mode !== 'select') {
          event.preventDefault();
          event.stopPropagation();
          this.addVertex(this.cursorCoord[0], this.cursorCoord[1]);
        }
        break;
      case 'Enter':
        event.preventDefault();
        event.stopPropagation();
        this.finishFeature();
        break;
      case 'Escape':
        if (this.draftVertices.length > 0) {
          event.preventDefault();
          event.stopPropagation();
          this.draftVertices = [];
        }
        break;
      case 'Home':
      case 'End':
        event.stopPropagation();
        break;
      default:
        break;
    }
  }

  private projectToSvg(coord: LngLatTuple): readonly [number, number] {
    const baseCenter = this._engine?.center ?? [0, 0];
    const x = 150 + (coord[0] - baseCenter[0]) * 50;
    const y = 70 - (coord[1] - baseCenter[1]) * 50;
    return [Math.max(6, Math.min(294, x)), Math.max(6, Math.min(134, y))];
  }

  protected override render(): TemplateResult {
    const regionLabel = this.label || this.t('regionLabel');
    const summary = this.t('statusSummary', {
      count: this.features.features.length,
      vertices: this.draftVertices.length,
    });
    const draftPoints = this.draftVertices.map((c) => this.projectToSvg(c).join(',')).join(' ');

    return html`
      <div class="base" part="base" role="region" aria-label=${regionLabel}>
        <div class="canvas" part="canvas" aria-hidden="true"></div>
        <slot name="fallback"></slot>
        <div class="toolbar" part="toolbar" role="toolbar" aria-label=${this.t('toolbarLabel')}>
          <button
            type="button"
            class="tool-btn"
            tabindex="0"
            aria-pressed=${String(this.mode === 'select')}
            ?disabled=${this.disabled}
            @click=${() => this.setMode('select')}
          >
            ${this.t('modeSelect')}
          </button>
          <button
            type="button"
            class="tool-btn"
            tabindex="-1"
            aria-pressed=${String(this.mode === 'point')}
            ?disabled=${this.disabled}
            @click=${() => this.setMode('point')}
          >
            ${this.t('modePoint')}
          </button>
          <button
            type="button"
            class="tool-btn"
            tabindex="-1"
            aria-pressed=${String(this.mode === 'line')}
            ?disabled=${this.disabled}
            @click=${() => this.setMode('line')}
          >
            ${this.t('modeLine')}
          </button>
          <button
            type="button"
            class="tool-btn"
            tabindex="-1"
            aria-pressed=${String(this.mode === 'polygon')}
            ?disabled=${this.disabled}
            @click=${() => this.setMode('polygon')}
          >
            ${this.t('modePolygon')}
          </button>
          <button
            type="button"
            class="tool-btn"
            tabindex="-1"
            ?disabled=${this.disabled || this.draftVertices.length < 2}
            @click=${() => this.finishFeature()}
          >
            ${this.t('finishDraft')}
          </button>
          <button
            type="button"
            class="tool-btn"
            tabindex="-1"
            ?disabled=${this.disabled || !this.canUndo}
            @click=${() => this.undo()}
          >
            ${this.t('undoAction')}
          </button>
          <button
            type="button"
            class="tool-btn"
            tabindex="-1"
            ?disabled=${this.disabled || !this.canRedo}
            @click=${() => this.redo()}
          >
            ${this.t('redoAction')}
          </button>
          <button
            type="button"
            class="tool-btn"
            tabindex="-1"
            ?disabled=${this.disabled || this.features.features.length === 0}
            @click=${() => this.clear()}
          >
            ${this.t('clearAction')}
          </button>
        </div>

        <svg
          class="surface"
          part="surface"
          viewBox="0 0 300 140"
          role="application"
          aria-label=${this.t('surfaceLabel')}
          tabindex=${this.disabled ? '-1' : '0'}
          @click=${this.handleSurfaceClick}
          @keydown=${this.handleSurfaceKeydown}
        >
          ${this.features.features.map((feat) => {
            if (feat.geometry.type === 'Point') {
              const [cx, cy] = this.projectToSvg(feat.geometry.coordinates);
              return svg`<circle class="shape" cx=${cx} cy=${cy} r="5"></circle>`;
            }
            if (feat.geometry.type === 'LineString') {
              const pts = feat.geometry.coordinates.map((c) => this.projectToSvg(c).join(',')).join(' ');
              return svg`<polyline class="shape" points=${pts}></polyline>`;
            }
            const ring = feat.geometry.coordinates[0] ?? [];
            const pts = ring.map((c) => this.projectToSvg(c).join(',')).join(' ');
            return svg`<polygon class="shape" points=${pts}></polygon>`;
          })}
          ${draftPoints ? svg`<polyline class="shape" points=${draftPoints}></polyline>` : null}
        </svg>

        <div class="status" part="status" aria-live="polite">${summary}</div>
      </div>
    `;
  }
}
