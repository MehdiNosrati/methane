import { html, property, query, state, UIElement, type PropertyValues, type TemplateResult } from '@methane/core';
import { ObserverPoolController, RovingFocusController } from '@methane/primitives';
import { createMapEngine, type BoundsTuple, type LngLatTuple, type MapEngineHandle } from '../shared/map-engine.js';
import { mapClusterMessages } from './map-cluster.messages.js';
import { mapClusterStyles } from './map-cluster.styles.js';

export interface ClusterPoint {
  readonly id: string;
  readonly lng: number;
  readonly lat: number;
  readonly label?: string;
}

export interface ComputedCluster {
  readonly id: string;
  readonly center: LngLatTuple;
  readonly points: ReadonlyArray<ClusterPoint>;
  readonly bounds: BoundsTuple;
}

export function computeSpatialClusters(
  points: ReadonlyArray<ClusterPoint>,
  zoom: number,
  radius: number,
  maxZoom: number,
): ReadonlyArray<ComputedCluster> {
  if (points.length === 0) return [];
  if (zoom >= maxZoom) {
    return points.map((pt) => ({
      id: `pt-${pt.id}`,
      center: [pt.lng, pt.lat],
      points: [pt],
      bounds: { west: pt.lng, south: pt.lat, east: pt.lng, north: pt.lat },
    }));
  }

  const cellDeg = Math.max(0.0005, (radius / 256) * (360 / Math.pow(2, Math.max(0, zoom))));
  const buckets = new Map<string, ClusterPoint[]>();

  for (const pt of points) {
    const gx = Math.floor((pt.lng + 180) / cellDeg);
    const gy = Math.floor((pt.lat + 90) / cellDeg);
    const key = `${gx}:${gy}`;
    const bucket = buckets.get(key);
    if (bucket) {
      bucket.push(pt);
    } else {
      buckets.set(key, [pt]);
    }
  }

  const clusters: ComputedCluster[] = [];
  for (const [key, group] of buckets.entries()) {
    let sumLng = 0;
    let sumLat = 0;
    let west = Infinity;
    let south = Infinity;
    let east = -Infinity;
    let north = -Infinity;
    for (const pt of group) {
      sumLng += pt.lng;
      sumLat += pt.lat;
      west = Math.min(west, pt.lng);
      south = Math.min(south, pt.lat);
      east = Math.max(east, pt.lng);
      north = Math.max(north, pt.lat);
    }
    const count = group.length;
    clusters.push({
      id: count === 1 ? `pt-${group[0]!.id}` : `cluster-${key}`,
      center: [Number((sumLng / count).toFixed(5)), Number((sumLat / count).toFixed(5))],
      points: group,
      bounds: { west, south, east, north },
    });
  }
  return clusters;
}

export class MthMapCluster extends UIElement {
  static override styles = mapClusterStyles;
  static override messages = mapClusterMessages;

  @property({ attribute: false }) points: ReadonlyArray<ClusterPoint> = [];
  @property({ type: Number }) radius = 48;
  @property({ type: Number }) zoom = 4;
  @property({ type: Number, attribute: 'max-zoom' }) maxZoom = 18;
  @property({ type: String }) label = '';

  @state() private activeZoom = 4;

  @query('.canvas') private canvasEl?: HTMLElement | null;

  private _engine: MapEngineHandle | null = null;
  private readonly observerCtrl = new ObserverPoolController(this);
  private observedCanvasEl: HTMLElement | null = null;
  private readonly rovingCtrl: RovingFocusController;

  constructor() {
    super();
    this.rovingCtrl = new RovingFocusController(this, {
      orientation: 'horizontal',
      loop: true,
      getItems: () => Array.from(this.shadowRoot?.querySelectorAll<HTMLElement>('.cluster-btn') ?? []),
    });
  }

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
    this.activeZoom = this.zoom;
    if (!this._engine) {
      this._engine = createMapEngine({
        host: this,
        zoom: this.activeZoom,
        maxZoom: this.maxZoom,
      });
    }
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
    if (changed.has('zoom')) {
      this.activeZoom = this.zoom;
      this._engine?.setView({ zoom: this.activeZoom });
    }
    this.rovingCtrl.updateOptions({
      dir: this.isRtl ? 'rtl' : 'ltr',
    });
  }

  protected override updated(changed: PropertyValues): void {
    super.updated(changed);
    this.syncEngineCanvas();
  }

  get clusters(): ReadonlyArray<ComputedCluster> {
    return computeSpatialClusters(this.points, this.activeZoom, this.radius, this.maxZoom);
  }

  expandCluster(cluster: ComputedCluster): void {
    if (cluster.points.length <= 1) {
      const point = cluster.points[0];
      if (point) {
        this._engine?.setView({ center: [point.lng, point.lat] });
        this.emitEvent('mth-cluster-select', { detail: { point } });
      }
      return;
    }
    const nextZoom = Math.min(this.maxZoom, this.activeZoom + 2);
    this.activeZoom = nextZoom;
    this._engine?.fitBounds(cluster.bounds);
    this._engine?.setView({ center: cluster.center, zoom: nextZoom });
    this.emitEvent('mth-cluster-expand', {
      detail: {
        clusterId: cluster.id,
        count: cluster.points.length,
        center: cluster.center,
        zoom: nextZoom,
      },
    });
  }

  protected override render(): TemplateResult {
    const computed = this.clusters;
    const regionLabel = this.label || this.t('regionLabel');
    const summaryText = this.t('summaryText', {
      clusters: computed.length,
      total: this.points.length,
      zoom: this.activeZoom,
    });

    return html`
      <div class="base" part="base" role="region" aria-label=${regionLabel}>
        <div class="canvas" part="canvas" aria-hidden="true"></div>
        <div class="layer">
          <slot name="fallback"></slot>
          <div class="clusters" part="clusters" role="toolbar" aria-label=${this.t('clusterListLabel')}>
            ${computed.map((cluster, idx) => {
              const isSingle = cluster.points.length === 1;
              const pointLabel = cluster.points[0]?.label ?? cluster.points[0]?.id ?? cluster.id;
              const ariaLabel = isSingle
                ? this.t('pointItemLabel', { label: pointLabel })
                : this.t('clusterItemLabel', { count: cluster.points.length });
              return html`
                <button
                  type="button"
                  class=${isSingle ? 'cluster-btn single' : 'cluster-btn'}
                  part="cluster-item"
                  tabindex=${idx === 0 ? '0' : '-1'}
                  aria-label=${ariaLabel}
                  @click=${() => this.expandCluster(cluster)}
                >
                  ${isSingle ? pointLabel : String(cluster.points.length)}
                </button>
              `;
            })}
          </div>
        </div>
        <div class="summary" part="summary" aria-live="polite">${summaryText}</div>
      </div>
    `;
  }
}
