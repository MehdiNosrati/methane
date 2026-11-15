import { html, property, query, svg, UIElement, type PropertyValues, type TemplateResult } from '@methane/core';
import { ObserverPoolController } from '@methane/primitives';
import { createMapEngine, type BoundsTuple, type MapEngineHandle } from '../shared/map-engine.js';
import { mapRouteMessages } from './map-route.messages.js';
import { mapRouteStyles } from './map-route.styles.js';

export interface RouteWaypoint {
  readonly lng: number;
  readonly lat: number;
  readonly label?: string;
}

const EARTH_RADIUS_KM = 6371;

export function haversineKm(a: RouteWaypoint, b: RouteWaypoint): number {
  const toRad = (deg: number): number => (deg * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const sinDLat = Math.sin(dLat / 2);
  const sinDLng = Math.sin(dLng / 2);
  const h = sinDLat * sinDLat + Math.cos(lat1) * Math.cos(lat2) * sinDLng * sinDLng;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.min(1, Math.sqrt(h)));
}

export class MthMapRoute extends UIElement {
  static override styles = mapRouteStyles;
  static override messages = mapRouteMessages;

  @property({ attribute: false }) origin: RouteWaypoint | null = null;
  @property({ attribute: false }) destination: RouteWaypoint | null = null;
  @property({ attribute: false }) waypoints: ReadonlyArray<RouteWaypoint> = [];
  @property({ type: String }) unit: 'km' | 'mi' = 'km';
  @property({ type: String }) label = '';

  @query('.canvas') private canvasEl?: HTMLElement | null;

  private _engine: MapEngineHandle | null = null;
  private readonly observerCtrl = new ObserverPoolController(this);
  private observedCanvasEl: HTMLElement | null = null;

  get engine(): MapEngineHandle | null {
    return this._engine;
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
      this.syncRouteBounds(false);
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
    if (changed.has('origin') || changed.has('destination') || changed.has('waypoints')) {
      this.syncRouteBounds(false);
    }
  }

  protected override updated(changed: PropertyValues): void {
    super.updated(changed);
    this.syncEngineCanvas();
  }

  get allStops(): ReadonlyArray<RouteWaypoint> {
    const list: RouteWaypoint[] = [];
    if (this.origin) list.push(this.origin);
    for (const wp of this.waypoints) list.push(wp);
    if (this.destination) list.push(this.destination);
    return list;
  }

  get totalDistanceKm(): number {
    const stops = this.allStops;
    let total = 0;
    for (let i = 1; i < stops.length; i += 1) {
      total += haversineKm(stops[i - 1]!, stops[i]!);
    }
    return Number(total.toFixed(2));
  }

  computeBounds(): BoundsTuple | null {
    const stops = this.allStops;
    if (stops.length === 0) return null;
    let west = Infinity;
    let south = Infinity;
    let east = -Infinity;
    let north = -Infinity;
    for (const s of stops) {
      west = Math.min(west, s.lng);
      south = Math.min(south, s.lat);
      east = Math.max(east, s.lng);
      north = Math.max(north, s.lat);
    }
    return { west, south, east, north };
  }

  fitRouteBounds(): void {
    this.syncRouteBounds(true);
  }

  private syncRouteBounds(emit: boolean): void {
    const bounds = this.computeBounds();
    if (!bounds || !this._engine) return;
    this._engine.fitBounds(bounds);
    if (emit) {
      this.emitEvent('mth-route-fit', {
        detail: {
          bounds,
          distanceKm: this.totalDistanceKm,
        },
      });
    }
  }

  private handleStopSelect(waypoint: RouteWaypoint, index: number): void {
    this._engine?.setView({ center: [waypoint.lng, waypoint.lat] });
    this.emitEvent('mth-waypoint-select', {
      detail: { waypoint, index },
    });
  }

  protected override render(): TemplateResult {
    const stops = this.allStops;
    const regionLabel = this.label || this.t('regionLabel');
    const km = this.totalDistanceKm;
    const summaryText =
      stops.length === 0
        ? this.t('emptyRoute')
        : this.unit === 'mi'
          ? this.t('distanceMi', { distance: (km * 0.621371).toFixed(2), stops: stops.length })
          : this.t('distanceKm', { distance: km.toFixed(2), stops: stops.length });

    const bounds = this.computeBounds();
    const spanLng = bounds ? Math.max(0.001, bounds.east - bounds.west) : 1;
    const spanLat = bounds ? Math.max(0.001, bounds.north - bounds.south) : 1;

    const svgCoords = stops.map((stop) => {
      if (!bounds) return [150, 50] as const;
      const x = 20 + ((stop.lng - bounds.west) / spanLng) * 260;
      const y = 85 - ((stop.lat - bounds.south) / spanLat) * 70;
      return [Number(x.toFixed(1)), Number(y.toFixed(1))] as const;
    });

    const polylinePoints = svgCoords.map(([x, y]) => `${x},${y}`).join(' ');

    return html`
      <div class="base" part="base" role="region" aria-label=${regionLabel}>
        <div class="canvas" part="canvas" aria-hidden="true"></div>
        <slot name="fallback"></slot>
        <div class="header">
          <div class="summary" part="summary" aria-live="polite">${summaryText}</div>
          <button type="button" class="fit-btn" @click=${() => this.fitRouteBounds()}>
            ${this.t('fitBounds')}
          </button>
        </div>

        <svg class="svg-route" part="polyline" viewBox="0 0 300 100" aria-hidden="true">
          ${polylinePoints ? svg`<polyline class="route-line" points=${polylinePoints}></polyline>` : null}
          ${svgCoords.map(([cx, cy]) => svg`<circle class="route-node" cx=${cx} cy=${cy} r="5"></circle>`)}
        </svg>

        <ol class="stops" part="stops" aria-label=${this.t('stopsLabel')}>
          ${stops.map((stop, idx) => {
            const fallbackLabel =
              idx === 0 && this.origin
                ? this.t('originDefault')
                : idx === stops.length - 1 && this.destination
                  ? this.t('destinationDefault')
                  : this.t('waypointDefault', { index: idx + 1 });
            return html`
              <li>
                <button
                  type="button"
                  class="stop-btn"
                  @click=${() => this.handleStopSelect(stop, idx)}
                >
                  ${stop.label ?? fallbackLabel}
                </button>
              </li>
            `;
          })}
        </ol>
      </div>
    `;
  }
}
