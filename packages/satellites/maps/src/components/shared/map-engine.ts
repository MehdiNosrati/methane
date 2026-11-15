import { isSafeUrl } from '@methane-ui/sanitize';
import type { Map as MapLibreMap, StyleSpecification } from 'maplibre-gl';

export type LngLatTuple = readonly [number, number];

export interface BoundsTuple {
  readonly west: number;
  readonly south: number;
  readonly east: number;
  readonly north: number;
}

export interface GeoJsonPointFeature {
  readonly type: 'Feature';
  readonly id?: string | number;
  readonly geometry: {
    readonly type: 'Point';
    readonly coordinates: readonly [number, number];
  };
  readonly properties?: Readonly<Record<string, unknown>>;
}

export interface GeoJsonLineFeature {
  readonly type: 'Feature';
  readonly id?: string | number;
  readonly geometry: {
    readonly type: 'LineString';
    readonly coordinates: ReadonlyArray<readonly [number, number]>;
  };
  readonly properties?: Readonly<Record<string, unknown>>;
}

export interface GeoJsonPolygonFeature {
  readonly type: 'Feature';
  readonly id?: string | number;
  readonly geometry: {
    readonly type: 'Polygon';
    readonly coordinates: ReadonlyArray<ReadonlyArray<readonly [number, number]>>;
  };
  readonly properties?: Readonly<Record<string, unknown>>;
}

export type MapGeoJsonFeature = GeoJsonPointFeature | GeoJsonLineFeature | GeoJsonPolygonFeature;

export interface MapGeoJsonFeatureCollection {
  readonly type: 'FeatureCollection';
  readonly features: ReadonlyArray<MapGeoJsonFeature>;
}

export interface MapEngineOptions {
  readonly host: HTMLElement;
  readonly center?: LngLatTuple;
  readonly zoom?: number;
  readonly minZoom?: number;
  readonly maxZoom?: number;
  readonly bearing?: number;
  readonly pitch?: number;
  readonly interactive?: boolean;
  readonly style?: string | StyleSpecification;
  readonly trackedTokens?: ReadonlyArray<string>;
}

export interface MapEngineHandle {
  readonly kind: 'maplibre' | 'headless';
  readonly nativeMap: MapLibreMap | null;
  readonly disposed: boolean;
  readonly center: LngLatTuple;
  readonly zoom: number;
  readonly bearing: number;
  readonly pitch: number;
  readonly style: string | StyleSpecification;
  readonly container: HTMLElement | null;
  attachContainer(container: HTMLElement | null): void;
  setStyle(style?: string | StyleSpecification): void;
  setView(next: {
    center?: LngLatTuple;
    zoom?: number;
    bearing?: number;
    pitch?: number;
  }): void;
  panBy(dx: number, dy: number): void;
  zoomBy(delta: number): void;
  fitBounds(bounds: BoundsTuple): void;
  resize(): void;
  syncThemeTokens(): Readonly<Record<string, string>>;
  getThemeToken(tokenName: string): string;
  remove(): void;
}

export const DEFAULT_TRACKED_MAP_TOKENS: readonly string[] = [
  '--mth-color-accent',
  '--mth-color-accent-hover',
  '--mth-color-accent-fg',
  '--mth-color-bg',
  '--mth-color-surface',
  '--mth-color-fg',
  '--mth-color-border',
  '--mth-color-danger',
  '--mth-color-success',
];

export const DEFAULT_EMPTY_MAP_STYLE: StyleSpecification = {
  version: 8,
  sources: {},
  layers: [],
};

export function clampNumber(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min;
  return Math.min(max, Math.max(min, value));
}

export function normalizeLngLat(lng: number, lat: number): LngLatTuple {
  const clampedLat = clampNumber(lat, -85.05112878, 85.05112878);
  const clampedLng = clampNumber(lng, -180, 180);
  return [Number(clampedLng.toFixed(6)), Number(clampedLat.toFixed(6))];
}

function canUseWebGLContext(): boolean {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return false;
  }
  if (typeof WebGLRenderingContext === 'undefined') {
    return false;
  }
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2') ?? canvas.getContext('webgl');
    return gl !== null;
  } catch {
    return false;
  }
}

function readHostCssToken(host: HTMLElement, tokenName: string): string {
  const inlineVal = host.style.getPropertyValue(tokenName).trim();
  if (inlineVal) return inlineVal;
  if (typeof getComputedStyle === 'function' && host.isConnected) {
    return getComputedStyle(host).getPropertyValue(tokenName).trim();
  }
  return '';
}

function resolveSafeMapStyle(
  style: string | StyleSpecification | undefined,
): string | StyleSpecification {
  if (typeof style === 'string') {
    const trimmed = style.trim();
    return trimmed && isSafeUrl(trimmed) ? trimmed : DEFAULT_EMPTY_MAP_STYLE;
  }
  return style ?? DEFAULT_EMPTY_MAP_STYLE;
}

export function createMapEngine(options: MapEngineOptions): MapEngineHandle {
  const minZoom = options.minZoom ?? 0;
  const maxZoom = options.maxZoom ?? 22;
  const trackedTokens = new Set<string>([
    ...DEFAULT_TRACKED_MAP_TOKENS,
    ...(options.trackedTokens ?? []),
  ]);

  let currentCenter: LngLatTuple = normalizeLngLat(
    options.center?.[0] ?? 0,
    options.center?.[1] ?? 0,
  );
  let currentZoom = clampNumber(options.zoom ?? 2, minZoom, maxZoom);
  let currentBearing = clampNumber(options.bearing ?? 0, -180, 180);
  let currentPitch = clampNumber(options.pitch ?? 0, 0, 85);
  let currentStyle: string | StyleSpecification = resolveSafeMapStyle(options.style);
  let isDisposed = false;
  let attachToken = 0;
  let activeContainer: HTMLElement | null = null;
  let nativeMap: MapLibreMap | null = null;
  const appliedTokens: Record<string, string> = {};

  function syncThemeTokens(): Readonly<Record<string, string>> {
    if (isDisposed) return appliedTokens;
    for (const tokenName of trackedTokens) {
      const value = readHostCssToken(options.host, tokenName);
      if (value) {
        appliedTokens[tokenName] = value;
      } else {
        delete appliedTokens[tokenName];
      }
    }
    return { ...appliedTokens };
  }

  function getThemeToken(tokenName: string): string {
    if (isDisposed) return '';
    trackedTokens.add(tokenName);
    const live = readHostCssToken(options.host, tokenName);
    if (live) {
      appliedTokens[tokenName] = live;
      return live;
    }
    return appliedTokens[tokenName] ?? '';
  }

  async function mountNativeMap(container: HTMLElement, token: number): Promise<void> {
    try {
      const mod = await import('maplibre-gl');
      if (isDisposed || attachToken !== token || activeContainer !== container) {
        return;
      }
      const MapConstructor = (mod.default?.Map ??
        (mod as unknown as { Map?: typeof MapLibreMap }).Map) as typeof MapLibreMap | undefined;
      if (typeof MapConstructor !== 'function') {
        nativeMap = null;
        return;
      }
      nativeMap = new MapConstructor({
        container,
        style: currentStyle,
        center: [currentCenter[0], currentCenter[1]],
        zoom: currentZoom,
        minZoom,
        maxZoom,
        bearing: currentBearing,
        pitch: currentPitch,
        interactive: options.interactive ?? true,
        attributionControl: false,
      });
    } catch {
      nativeMap = null;
    }
  }

  function attachContainer(container: HTMLElement | null): void {
    if (isDisposed || activeContainer === container) return;
    activeContainer = container;
    const token = ++attachToken;
    if (nativeMap) {
      nativeMap.remove();
      nativeMap = null;
    }
    if (!container || !canUseWebGLContext()) {
      return;
    }
    void mountNativeMap(container, token);
  }

  function setStyle(style?: string | StyleSpecification): void {
    if (isDisposed) return;
    currentStyle = resolveSafeMapStyle(style);
    nativeMap?.setStyle(currentStyle);
  }

  function setView(next: {
    center?: LngLatTuple;
    zoom?: number;
    bearing?: number;
    pitch?: number;
  }): void {
    if (isDisposed) return;
    if (next.center) {
      currentCenter = normalizeLngLat(next.center[0], next.center[1]);
    }
    if (typeof next.zoom === 'number') {
      currentZoom = clampNumber(next.zoom, minZoom, maxZoom);
    }
    if (typeof next.bearing === 'number') {
      currentBearing = clampNumber(next.bearing, -180, 180);
    }
    if (typeof next.pitch === 'number') {
      currentPitch = clampNumber(next.pitch, 0, 85);
    }
    if (nativeMap) {
      nativeMap.jumpTo({
        center: [currentCenter[0], currentCenter[1]],
        zoom: currentZoom,
        bearing: currentBearing,
        pitch: currentPitch,
      });
    }
  }

  function panBy(dx: number, dy: number): void {
    if (isDisposed) return;
    // Scale degree step inversely with zoom for deterministic viewport panning in headless mode.
    const stepDeg = 180 / Math.pow(2, currentZoom + 2);
    const nextLng = currentCenter[0] + (dx / 100) * stepDeg;
    const nextLat = currentCenter[1] - (dy / 100) * stepDeg;
    currentCenter = normalizeLngLat(nextLng, nextLat);
    if (nativeMap) {
      nativeMap.panBy([dx, dy], { duration: 0 });
    }
  }

  function zoomBy(delta: number): void {
    if (isDisposed) return;
    currentZoom = clampNumber(currentZoom + delta, minZoom, maxZoom);
    if (nativeMap) {
      nativeMap.setZoom(currentZoom);
    }
  }

  function fitBounds(bounds: BoundsTuple): void {
    if (isDisposed) return;
    const centerLng = (bounds.west + bounds.east) / 2;
    const centerLat = (bounds.south + bounds.north) / 2;
    currentCenter = normalizeLngLat(centerLng, centerLat);
    const spanLng = Math.max(0.001, Math.abs(bounds.east - bounds.west));
    const spanLat = Math.max(0.001, Math.abs(bounds.north - bounds.south));
    const maxSpan = Math.max(spanLng, spanLat);
    const computedZoom = Math.log2(360 / maxSpan);
    currentZoom = clampNumber(Number(computedZoom.toFixed(2)), minZoom, maxZoom);
    if (nativeMap) {
      nativeMap.fitBounds(
        [
          [bounds.west, bounds.south],
          [bounds.east, bounds.north],
        ],
        { duration: 0, padding: 24 },
      );
    }
  }

  function resize(): void {
    if (isDisposed) return;
    nativeMap?.resize();
  }

  function remove(): void {
    if (isDisposed) return;
    isDisposed = true;
    if (nativeMap) {
      nativeMap.remove();
      nativeMap = null;
    }
    activeContainer = null;
  }

  syncThemeTokens();

  return {
    get kind() {
      return nativeMap ? 'maplibre' : 'headless';
    },
    get nativeMap() {
      return nativeMap;
    },
    get disposed() {
      return isDisposed;
    },
    get center() {
      return currentCenter;
    },
    get zoom() {
      return currentZoom;
    },
    get bearing() {
      return currentBearing;
    },
    get pitch() {
      return currentPitch;
    },
    get style() {
      return currentStyle;
    },
    get container() {
      return activeContainer;
    },
    attachContainer,
    setStyle,
    setView,
    panBy,
    zoomBy,
    fitBounds,
    resize,
    syncThemeTokens,
    getThemeToken,
    remove,
  };
}
