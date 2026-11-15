export const MTH_CHART_TYPES = [
  'line',
  'bar',
  'area',
  'pie',
  'donut',
  'scatter',
  'bubble',
  'heatmap',
  'treemap',
  'sunburst',
  'sankey',
  'radar',
  'gauge',
  'funnel',
  'candlestick',
  'histogram',
  'boxplot',
  'graph',
  'choropleth',
] as const;

export type MthChartType = (typeof MTH_CHART_TYPES)[number];

export interface MthChartSeriesInput {
  name?: string;
  type: MthChartType;
  data: ReadonlyArray<unknown>;
  stack?: string;
  color?: string;
  smooth?: boolean;
  hidden?: boolean;
  xAxisIndex?: number;
  yAxisIndex?: number;
  seriesOptions?: Record<string, unknown>;
}

export interface MthChartSeriesElementLike extends HTMLElement {
  name: string;
  type: MthChartType;
  stack: string;
  color: string;
  smooth: boolean;
  hidden: boolean;
  xAxisIndex: number;
  yAxisIndex: number;
  seriesOptions?: Record<string, unknown>;
  getResolvedData?(): ReadonlyArray<unknown>;
}

function isChartType(value: string): value is MthChartType {
  return (MTH_CHART_TYPES as ReadonlyArray<string>).includes(value);
}

export function extractChartSeriesInput(node: Element): MthChartSeriesInput | null {
  if (!node.localName.endsWith('-chart-series')) return null;
  const candidate = node as MthChartSeriesElementLike;
  const rawType = typeof candidate.type === 'string' ? candidate.type : (node.getAttribute('type') ?? 'line');
  const resolvedType: MthChartType = isChartType(rawType) ? rawType : 'line';

  let data: ReadonlyArray<unknown> = [];
  if (typeof candidate.getResolvedData === 'function') {
    data = candidate.getResolvedData();
  } else {
    const rawJson = node.getAttribute('data-json') ?? '';
    if (rawJson.trim()) {
      try {
        const parsed = JSON.parse(rawJson) as unknown;
        if (Array.isArray(parsed)) data = parsed;
      } catch {
        data = [];
      }
    }
  }

  return {
    name: typeof candidate.name === 'string' ? candidate.name : (node.getAttribute('name') ?? ''),
    type: resolvedType,
    data,
    stack: typeof candidate.stack === 'string' ? candidate.stack : (node.getAttribute('stack') ?? ''),
    color: typeof candidate.color === 'string' ? candidate.color : (node.getAttribute('color') ?? ''),
    smooth: typeof candidate.smooth === 'boolean' ? candidate.smooth : node.hasAttribute('smooth'),
    hidden: typeof candidate.hidden === 'boolean' ? candidate.hidden : node.hasAttribute('hidden'),
    xAxisIndex: typeof candidate.xAxisIndex === 'number' ? candidate.xAxisIndex : 0,
    yAxisIndex: typeof candidate.yAxisIndex === 'number' ? candidate.yAxisIndex : 0,
    ...(candidate.seriesOptions ? { seriesOptions: candidate.seriesOptions } : {}),
  };
}
