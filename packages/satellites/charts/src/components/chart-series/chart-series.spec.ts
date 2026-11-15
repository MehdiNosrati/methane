import type { ComponentBehaviorSpec } from '@methane/spec-compiler';

export const chartSeriesSpec: ComponentBehaviorSpec = {
  tag: 'mth-chart-series',
  package: '@methane/charts',
  conformance: [],
  controllers: [],
  focusModel: 'none',
  states: ['hidden'],
  keyboard: [],
  props: [
    { name: 'name', attr: 'name', type: 'string', default: '' },
    { name: 'type', attr: 'type', type: 'MthChartType', default: 'line' },
    { name: 'dataJson', attr: 'data-json', type: 'string', default: '' },
    { name: 'data', attr: false, type: 'ReadonlyArray<unknown>', default: undefined },
    { name: 'stack', attr: 'stack', type: 'string', default: '' },
    { name: 'color', attr: 'color', type: 'string', default: '' },
    { name: 'smooth', attr: 'smooth', type: 'boolean', default: false },
    { name: 'hidden', attr: 'hidden', type: 'boolean', default: false },
    { name: 'xAxisIndex', attr: 'x-axis-index', type: 'number', default: 0 },
    { name: 'yAxisIndex', attr: 'y-axis-index', type: 'number', default: 0 },
  ],
  events: [
    {
      name: 'mth-series-change',
      cancelable: false,
      detailType: '{ name: string; type: MthChartType }',
    },
  ],
  slots: [
    { name: '', description: 'Optional declarative fallback content.' },
  ],
  parts: [
    { name: 'base', description: 'Non-visual metadata slot container.' },
  ],
  messages: {
    seriesLabel: 'Chart data series',
  },
};

export const CEM_METADATA = {
  description:
    'Declarative chart data series child element for `<mth-chart>`, supporting all 19 ECharts visualization types (`line`, `bar`, `area`, `pie`, `donut`, `scatter`, `bubble`, `heatmap`, `treemap`, `sunburst`, `sankey`, `radar`, `gauge`, `funnel`, `candlestick`, `histogram`, `boxplot`, `graph`, `choropleth`).',
  propDescriptions: {
    name: 'Series display name shown in legend and tooltips.',
    type: 'One of the 19 supported chart visualization types.',
    dataJson: 'JSON-encoded data array attribute for declarative HTML usage.',
    data: 'Structured JS series data array.',
    stack: 'Optional stacking group key for bar/line/area charts.',
    color: 'Optional explicit series color token or CSS color.',
    smooth: 'Applies curve smoothing to line and area series.',
    hidden: 'Hides the series from rendering while keeping its definition.',
    xAxisIndex: 'Target X-axis index for multi-axis charts.',
    yAxisIndex: 'Target Y-axis index for multi-axis charts.',
  },
  eventDescriptions: {
    'mth-series-change': 'Emitted when series data or configuration updates.',
  },
};
