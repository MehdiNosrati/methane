import { UIElement, type PropertyValues } from '@methane/core';
import { MotionController, ObserverPoolController } from '@methane/primitives';
import { escapeHtml } from '@methane/sanitize';
import type {
  EChartsCoreOption,
  EChartsType,
  init as echartsInit,
  SetOptionOpts,
} from 'echarts/core';
import { html, nothing } from 'lit';
import { property, query, state } from 'lit/decorators.js';
import {
  extractChartSeriesInput,
  type MthChartSeriesInput,
  type MthChartType,
} from '../shared/chart-types.js';
import { chartMessages } from './chart.messages.js';
import { chartStyles } from './chart.styles.js';

type EChartsInitFn = typeof echartsInit;

let echartsInitCache: EChartsInitFn | null = null;
let echartsLoadPromise: Promise<EChartsInitFn> | null = null;

function isBrowserDom(): boolean {
  return typeof document !== 'undefined' && Boolean(document.documentElement?.style);
}

function loadEchartsInit(): Promise<EChartsInitFn> {
  if (echartsInitCache) {
    return Promise.resolve(echartsInitCache);
  }
  if (!echartsLoadPromise) {
    echartsLoadPromise = Promise.all([
      import('echarts/core'),
      import('echarts/charts'),
      import('echarts/components'),
      import('echarts/renderers'),
    ]).then(([core, charts, components, renderers]) => {
      core.use([
        charts.LineChart,
        charts.BarChart,
        charts.PieChart,
        charts.ScatterChart,
        charts.HeatmapChart,
        charts.TreemapChart,
        charts.SunburstChart,
        charts.SankeyChart,
        charts.RadarChart,
        charts.GaugeChart,
        charts.FunnelChart,
        charts.CandlestickChart,
        charts.BoxplotChart,
        charts.GraphChart,
        charts.MapChart,
        components.GridComponent,
        components.TooltipComponent,
        components.LegendComponent,
        components.TitleComponent,
        components.AriaComponent,
        components.DataZoomComponent,
        components.GeoComponent,
        components.ParallelComponent,
        components.PolarComponent,
        components.RadarComponent,
        components.VisualMapComponent,
        renderers.CanvasRenderer,
        renderers.SVGRenderer,
      ]);
      echartsInitCache = core.init;
      return core.init;
    });
  }
  return echartsLoadPromise;
}

export type { MthChartSeriesInput } from '../shared/chart-types.js';

export interface MthChartEngineHandle {
  readonly kind: 'echarts' | 'headless';
  readonly renderer: 'canvas' | 'svg';
  readonly echarts: EChartsType | null;
  getOption(): EChartsCoreOption | null;
  setOption(option: EChartsCoreOption, opts?: SetOptionOpts): void;
  resize(): void;
  getAppliedToken(tokenName: string): string;
  dispose(): void;
  readonly disposed: boolean;
}

const CHART_TOKEN_NAMES = [
  '--mth-color-accent',
  '--mth-color-fg',
  '--mth-color-fg-muted',
  '--mth-color-surface',
  '--mth-color-border',
  '--mth-color-info',
  '--mth-color-success',
  '--mth-color-warning',
  '--mth-color-danger',
] as const;

const CARTESIAN_TYPES: ReadonlySet<MthChartType> = new Set([
  'line',
  'bar',
  'area',
  'scatter',
  'bubble',
  'heatmap',
  'candlestick',
  'histogram',
  'boxplot',
]);

/**
 * Maps any of the 19 Methane chart types into a normalized ECharts series configuration.
 */
export function mapMthChartTypeToEChartsSeries(
  input: MthChartSeriesInput,
): Record<string, unknown> {
  const base: Record<string, unknown> = {
    name: input.name ?? '',
    data: [...input.data],
    ...(input.color ? { itemStyle: { color: input.color }, lineStyle: { color: input.color } } : {}),
    ...(input.seriesOptions ?? {}),
  };

  switch (input.type) {
    case 'line':
      return {
        ...base,
        type: 'line',
        smooth: Boolean(input.smooth),
        ...(input.stack ? { stack: input.stack } : {}),
        xAxisIndex: input.xAxisIndex ?? 0,
        yAxisIndex: input.yAxisIndex ?? 0,
      };
    case 'area':
      return {
        ...base,
        type: 'line',
        areaStyle: {},
        smooth: Boolean(input.smooth),
        ...(input.stack ? { stack: input.stack } : {}),
        xAxisIndex: input.xAxisIndex ?? 0,
        yAxisIndex: input.yAxisIndex ?? 0,
      };
    case 'bar':
      return {
        ...base,
        type: 'bar',
        ...(input.stack ? { stack: input.stack } : {}),
        xAxisIndex: input.xAxisIndex ?? 0,
        yAxisIndex: input.yAxisIndex ?? 0,
      };
    case 'histogram':
      return {
        ...base,
        type: 'bar',
        barCategoryGap: '0%',
        barGap: '0%',
        xAxisIndex: input.xAxisIndex ?? 0,
        yAxisIndex: input.yAxisIndex ?? 0,
      };
    case 'pie':
      return { ...base, type: 'pie', radius: '70%' };
    case 'donut':
      return { ...base, type: 'pie', radius: ['45%', '75%'] };
    case 'scatter':
      return {
        ...base,
        type: 'scatter',
        xAxisIndex: input.xAxisIndex ?? 0,
        yAxisIndex: input.yAxisIndex ?? 0,
      };
    case 'bubble':
      return {
        ...base,
        type: 'scatter',
        symbolSize: (value: unknown) => {
          if (Array.isArray(value) && typeof value[2] === 'number') {
            return Math.max(6, Math.min(64, value[2]));
          }
          return 12;
        },
        xAxisIndex: input.xAxisIndex ?? 0,
        yAxisIndex: input.yAxisIndex ?? 0,
      };
    case 'heatmap':
      return {
        ...base,
        type: 'heatmap',
        xAxisIndex: input.xAxisIndex ?? 0,
        yAxisIndex: input.yAxisIndex ?? 0,
      };
    case 'treemap':
      return { ...base, type: 'treemap' };
    case 'sunburst':
      return { ...base, type: 'sunburst' };
    case 'sankey':
      return { ...base, type: 'sankey' };
    case 'radar':
      return { ...base, type: 'radar' };
    case 'gauge':
      return { ...base, type: 'gauge' };
    case 'funnel':
      return { ...base, type: 'funnel' };
    case 'candlestick':
      return {
        ...base,
        type: 'candlestick',
        xAxisIndex: input.xAxisIndex ?? 0,
        yAxisIndex: input.yAxisIndex ?? 0,
      };
    case 'boxplot':
      return {
        ...base,
        type: 'boxplot',
        xAxisIndex: input.xAxisIndex ?? 0,
        yAxisIndex: input.yAxisIndex ?? 0,
      };
    case 'graph':
      return { ...base, type: 'graph', layout: 'none' };
    case 'choropleth':
      return {
        ...base,
        type: 'map',
        map: typeof input.seriesOptions?.map === 'string' ? input.seriesOptions.map : 'world',
      };
  }
}

function parseJsonArray<T>(raw: string): ReadonlyArray<T> {
  if (raw.trim().length === 0) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? (parsed as ReadonlyArray<T>) : [];
  } catch {
    return [];
  }
}

/**
 * `<mth-chart>`: Wrap-first Apache ECharts visualization component supporting 19 chart types.
 */
export class MthChart extends UIElement {
  static override shadowRootOptions = {
    ...UIElement.shadowRootOptions,
    delegatesFocus: true,
  };
  static override messages = chartMessages;
  static override styles = chartStyles;

  private readonly motionCtrl = new MotionController(this);
  private readonly observerPool = new ObserverPoolController(this);

  @property({ type: String, attribute: 'chart-title' })
  chartTitle = '';

  @property({ type: String })
  subtitle = '';

  @property({ type: String, reflect: true })
  type: MthChartType = 'line';

  @property({ type: String, reflect: true })
  renderer: 'canvas' | 'svg' = 'canvas';

  @property({ type: String, reflect: true })
  size: 'sm' | 'md' | 'lg' | 'full' = 'md';

  @property({ type: Boolean, attribute: 'show-legend' })
  showLegend = true;

  @property({ type: Boolean, attribute: 'show-tooltip' })
  showTooltip = true;

  @property({ type: Boolean, reflect: true, attribute: 'show-fallback' })
  showFallback = false;

  @property({ type: String, attribute: 'categories-json' })
  categoriesJson = '';

  @property({ attribute: false })
  categories: ReadonlyArray<string> = [];

  @property({ type: String, attribute: 'data-json' })
  dataJson = '';

  @property({ attribute: false })
  data: ReadonlyArray<unknown> = [];

  @property({ attribute: false })
  series: ReadonlyArray<MthChartSeriesInput> = [];

  @property({ attribute: false })
  option: EChartsCoreOption = {};

  @property({ type: Boolean, reflect: true })
  loading = false;

  @property({ type: Boolean, reflect: true })
  empty = false;

  @query('[part="canvas"]')
  private canvasEl?: HTMLDivElement | null;

  @state()
  private hasSlottedFallback = false;

  private _engine: MthChartEngineHandle | null = null;
  private _echartsInstance: EChartsType | null = null;
  private _lastOption: EChartsCoreOption | null = null;
  private _tokenCache: Map<string, string> = new Map();
  private _readyEmitted = false;
  private _mountTimer: ReturnType<typeof setTimeout> | undefined;
  private _mountGen = 0;
  private _observedCanvasEl: HTMLElement | null = null;
  private _lastSyncedDir: 'ltr' | 'rtl' | '' = '';
  private _lastSyncedLocale = '';

  get engine(): MthChartEngineHandle | null {
    return this._engine;
  }

  override connectedCallback(): void {
    super.connectedCallback();
    this._syncTokens();
    this._initEngineHandle();
    if (this.hasUpdated) {
      this._bindCanvasResizeObserver();
      this._syncChartOption();
      this._scheduleEngineMount();
    }
  }

  override disconnectedCallback(): void {
    this._mountGen += 1;
    if (this._mountTimer !== undefined) {
      clearTimeout(this._mountTimer);
      this._mountTimer = undefined;
    }
    this._observedCanvasEl = null;
    this._disposeEngine();
    super.disconnectedCallback();
  }

  protected override firstUpdated(): void {
    this._bindCanvasResizeObserver();
    this._syncChartOption();
    this._scheduleEngineMount();
  }

  private _bindCanvasResizeObserver(): void {
    if (!this.canvasEl || this._observedCanvasEl === this.canvasEl) return;
    this._observedCanvasEl = this.canvasEl;
    this.observerPool.observeResize(this.canvasEl, () => {
      this.resize();
    });
  }

  private _scheduleEngineMount(): void {
    if (this._mountTimer !== undefined || !this.isConnected || !isBrowserDom()) return;
    const gen = this._mountGen;
    this._mountTimer = setTimeout(() => {
      this._mountTimer = undefined;
      void this._attachCanvasOrSvgInstance().then(() => {
        if (gen !== this._mountGen || !this.isConnected) return;
        if (this._lastOption && this._echartsInstance) {
          try {
            this._echartsInstance.setOption(this._lastOption, { notMerge: true });
          } catch {
            // Ignore headless canvas failures
          }
        }
      });
    }, 0);
  }

  protected override willUpdate(changed: PropertyValues): void {
    super.willUpdate(changed);
    if (changed.has('loading')) {
      this.setCustomState('loading', this.loading);
    }
    if (changed.has('empty')) {
      this.setCustomState('empty', this.empty);
    }
    this.setCustomState('reduced-motion', this.motionCtrl.isReducedMotion);
  }

  protected override updated(changed: PropertyValues): void {
    super.updated(changed);
    if (changed.has('renderer') && changed.get('renderer') !== undefined) {
      this._recreateLiveInstance();
    }
    const localeOrDirChanged =
      this.resolvedDir !== this._lastSyncedDir ||
      this.resolvedLocale !== this._lastSyncedLocale;
    if (
      changed.has('type') ||
      changed.has('chartTitle') ||
      changed.has('subtitle') ||
      changed.has('showLegend') ||
      changed.has('showTooltip') ||
      changed.has('categories') ||
      changed.has('categoriesJson') ||
      changed.has('data') ||
      changed.has('dataJson') ||
      changed.has('series') ||
      changed.has('option') ||
      localeOrDirChanged
    ) {
      this._lastSyncedDir = this.resolvedDir;
      this._lastSyncedLocale = this.resolvedLocale;
      this._syncTokens();
      this._syncChartOption();
    }
  }

  resize(): void {
    this._engine?.resize();
  }

  setChartOption(nextOption: EChartsCoreOption, opts?: SetOptionOpts): void {
    this._syncTokens();
    this._engine?.setOption(nextOption, opts);
  }

  getAppliedToken(tokenName: string): string {
    this._syncTokens();
    return this._tokenCache.get(tokenName) ?? '';
  }

  buildEChartsOption(): EChartsCoreOption {
    this._syncTokens();
    const resolvedSeries = this._collectSeriesInputs();
    const visibleSeries = resolvedSeries.filter((item) => !item.hidden);
    const echartsSeries = visibleSeries.map((item) => mapMthChartTypeToEChartsSeries(item));
    const hasCartesian = visibleSeries.some((item) => CARTESIAN_TYPES.has(item.type));
    const resolvedCategories =
      this.categories.length > 0 ? this.categories : parseJsonArray<string>(this.categoriesJson);

    const accentColor = this._tokenCache.get('--mth-color-accent') || 'oklch(0.6 0.2 250)';
    const fgColor = this._tokenCache.get('--mth-color-fg') || 'oklch(0.2 0.02 260)';
    const mutedColor = this._tokenCache.get('--mth-color-fg-muted') || 'oklch(0.45 0.02 260)';
    const infoColor = this._tokenCache.get('--mth-color-info') || 'oklch(0.58 0.16 240)';
    const successColor = this._tokenCache.get('--mth-color-success') || 'oklch(0.6 0.16 150)';
    const warningColor = this._tokenCache.get('--mth-color-warning') || 'oklch(0.72 0.16 80)';
    const dangerColor = this._tokenCache.get('--mth-color-danger') || 'oklch(0.58 0.2 25)';

    const isRtl = this.resolvedDir === 'rtl';

    const generated: EChartsCoreOption = {
      animation: !this.motionCtrl.isReducedMotion,
      aria: {
        enabled: true,
        label: {
          description: escapeHtml(this.chartTitle || this.t('chartLabel')),
        },
      },
      color: [accentColor, infoColor, successColor, warningColor, dangerColor],
      textStyle: {
        color: fgColor,
      },
      tooltip: this.showTooltip
        ? {
            show: true,
            renderMode: 'richText',
            formatter: (params: unknown) => this._formatSafeTooltip(params),
          }
        : { show: false },
      legend: this.showLegend
        ? {
            show: true,
            ...(isRtl ? { right: 'auto', left: 0 } : {}),
            textStyle: { color: mutedColor },
          }
        : { show: false },
      ...(hasCartesian
        ? {
            grid: { left: '8%', right: '6%', top: 40, bottom: 32 },
            xAxis: {
              type: 'category',
              inverse: isRtl,
              ...(resolvedCategories.length > 0 ? { data: [...resolvedCategories] } : {}),
            },
            yAxis: {
              type: 'value',
              position: isRtl ? 'right' : 'left',
            },
          }
        : {}),
      series: echartsSeries,
      ...this.option,
    };

    return generated;
  }

  private _formatSafeTooltip(params: unknown): string {
    const items = Array.isArray(params) ? params : [params];
    const lines: string[] = [];
    for (const entry of items) {
      if (typeof entry !== 'object' || entry === null) continue;
      const record = entry as Record<string, unknown>;
      const seriesName = typeof record.seriesName === 'string' ? escapeHtml(record.seriesName) : '';
      const name = typeof record.name === 'string' ? escapeHtml(record.name) : '';
      const valueText = record.value !== undefined ? escapeHtml(String(record.value)) : '';
      const prefix = seriesName ? `${seriesName}: ` : '';
      lines.push(`${prefix}${name ? `${name} = ` : ''}${valueText}`);
    }
    return lines.join('\n');
  }

  private _collectSeriesInputs(): ReadonlyArray<MthChartSeriesInput> {
    if (this.series.length > 0) {
      return this.series;
    }

    const childSeries: MthChartSeriesInput[] = [];
    for (const node of Array.from(this.children ?? [])) {
      const extracted = extractChartSeriesInput(node);
      if (extracted) childSeries.push(extracted);
    }
    if (childSeries.length > 0) {
      return childSeries;
    }

    const directData =
      this.data.length > 0 ? this.data : parseJsonArray<unknown>(this.dataJson);
    if (directData.length > 0) {
      return [
        {
          name: this.chartTitle || this.type,
          type: this.type,
          data: directData,
        },
      ];
    }

    return [];
  }

  private _syncTokens(): void {
    if (typeof window === 'undefined' || !this.isConnected) return;
    const computed = window.getComputedStyle(this);
    for (const tokenName of CHART_TOKEN_NAMES) {
      const value = computed.getPropertyValue(tokenName).trim() || this.style.getPropertyValue(tokenName).trim();
      if (value) {
        this._tokenCache.set(tokenName, value);
      }
    }
  }

  private _initEngineHandle(): void {
    if (this._engine && !this._engine.disposed) return;

    let disposed = false;
    const getEcharts = (): EChartsType | null => this._echartsInstance;
    const getAppliedToken = (tokenName: string): string => this.getAppliedToken(tokenName);

    this._engine = {
      get kind() {
        return getEcharts() ? 'echarts' : 'headless';
      },
      renderer: this.renderer,
      get echarts() {
        return getEcharts();
      },
      getOption: () => this._lastOption,
      setOption: (option: EChartsCoreOption, opts?: SetOptionOpts) => {
        if (disposed) return;
        this._lastOption = option;
        try {
          this._echartsInstance?.setOption(option, opts);
        } catch {
          // Graceful headless fallback when Canvas/SVG rendering is unavailable in test DOM
        }
      },
      resize: () => {
        if (disposed) return;
        try {
          this._echartsInstance?.resize();
        } catch {
          // Headless fallback no-op
        }
      },
      getAppliedToken,
      dispose: () => {
        if (disposed) return;
        disposed = true;
        if (this._echartsInstance) {
          try {
            this._echartsInstance.dispose();
          } catch {
            // Ignore disposal errors in detached test DOM
          }
          this._echartsInstance = null;
        }
      },
      get disposed() {
        return disposed;
      },
    };
  }

  private async _attachCanvasOrSvgInstance(): Promise<void> {
    if (!this.isConnected || !this.canvasEl || this._echartsInstance || !isBrowserDom()) return;
    const gen = this._mountGen;
    try {
      const initFn = await loadEchartsInit();
      if (!this.isConnected || !this.canvasEl || this._echartsInstance || gen !== this._mountGen) {
        return;
      }
      const width = this.canvasEl.clientWidth > 0 ? this.canvasEl.clientWidth : 640;
      const height = this.canvasEl.clientHeight > 0 ? this.canvasEl.clientHeight : 320;
      const instance = initFn(this.canvasEl, undefined, {
        renderer: this.renderer,
        width,
        height,
      });
      instance.on('click', (params: Record<string, unknown>) => {
        this.emitEvent('mth-point-select', {
          detail: {
            seriesName: typeof params.seriesName === 'string' ? params.seriesName : '',
            dataIndex: typeof params.dataIndex === 'number' ? params.dataIndex : -1,
            name: typeof params.name === 'string' ? params.name : '',
            value: params.value ?? null,
          },
        });
      });
      this._echartsInstance = instance;
    } catch {
      // JSDOM without Canvas 2D backend falls back cleanly to typed headless engine handle
      this._echartsInstance = null;
    }

    if (!this._readyEmitted && this.isConnected && gen === this._mountGen) {
      this._readyEmitted = true;
      this.emitEvent('mth-chart-ready', {
        detail: {
          renderer: this.renderer,
          mode: this._echartsInstance ? 'echarts' : 'headless',
        },
      });
    }
  }

  private _recreateLiveInstance(): void {
    this._mountGen += 1;
    if (this._echartsInstance) {
      try {
        this._echartsInstance.dispose();
      } catch {
        // Ignore teardown issues
      }
      this._echartsInstance = null;
    }
    this._syncChartOption();
    const gen = this._mountGen;
    void this._attachCanvasOrSvgInstance().then(() => {
      if (gen !== this._mountGen || !this.isConnected) return;
      this._syncChartOption();
    });
  }

  private _disposeEngine(): void {
    this._engine?.dispose();
    this._engine = null;
    this._echartsInstance = null;
    this._readyEmitted = false;
  }

  private _syncChartOption(): void {
    if (!this.isConnected || !this._engine || this._engine.disposed) return;
    const option = this.buildEChartsOption();
    this._engine.setOption(option, { notMerge: true });
    const seriesList = Array.isArray(option.series) ? option.series : [];
    this.emitEvent('mth-chart-render', {
      detail: { seriesCount: seriesList.length },
    });
  }

  private _onSeriesSlotChange = (): void => {
    this._syncChartOption();
  };

  private _onFallbackSlotChange = (event: Event): void => {
    const slot = event.target as HTMLSlotElement | null;
    const assigned = slot?.assignedNodes({ flatten: true }) ?? [];
    this.hasSlottedFallback = assigned.length > 0;
  };

  private _onToggleFallback = (): void => {
    this.showFallback = !this.showFallback;
  };

  override render() {
    const label = this.ariaLabel || this.chartTitle || this.t('chartLabel');

    return html`
      <div part="base" class="base" dir=${this.resolvedDir}>
        <div part="header" class="header" ?hidden=${!this.chartTitle && !this.subtitle && !this.hasSlottedFallback}>
          <div class="headings">
            ${this.chartTitle
              ? html`<h3 part="title" class="title">${this.chartTitle}</h3>`
              : nothing}
            ${this.subtitle
              ? html`<p part="subtitle" class="subtitle">${this.subtitle}</p>`
              : nothing}
          </div>
          <button
            type="button"
            part="toggle"
            class="toggle"
            ?hidden=${!this.hasSlottedFallback}
            aria-expanded=${this.showFallback ? 'true' : 'false'}
            @click=${this._onToggleFallback}
          >
            ${this.showFallback
              ? this.t('fallbackToggleHide')
              : this.t('fallbackToggleShow')}
          </button>
        </div>

        <div class="viewport">
          <div
            part="canvas"
            class="canvas"
            role="img"
            aria-label=${label}
          ></div>
          ${this.loading
            ? html`<div part="status" class="status" role="status">${this.t('loadingLabel')}</div>`
            : this.empty
              ? html`<div part="status" class="status"><slot name="empty">${this.t('emptyLabel')}</slot></div>`
              : nothing}
        </div>

        <div part="fallback" class=${this.showFallback ? 'fallback-visible' : 'fallback-sr'}>
          <slot name="fallback" @slotchange=${this._onFallbackSlotChange}></slot>
        </div>

        <div class="series-slot" aria-hidden="true" @mth-series-change=${this._onSeriesSlotChange}>
          <slot @slotchange=${this._onSeriesSlotChange}></slot>
        </div>
      </div>
    `;
  }
}
