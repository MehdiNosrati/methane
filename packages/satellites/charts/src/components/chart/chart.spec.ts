import type { ComponentBehaviorSpec } from '@methane-ui/spec-compiler';
import { chartMessages } from './chart.messages.js';

export const chartSpec: ComponentBehaviorSpec = {
  tag: 'mth-chart',
  package: '@methane-ui/charts',
  conformance: ['satellite'],
  controllers: ['MotionController', 'ObserverPoolController'],
  focusModel: 'delegates-focus',
  states: ['loading', 'empty', 'reduced-motion'],
  keyboard: [
    {
      key: 'Enter',
      when: 'focus is on the data table toggle button',
      expect: 'toggles visibility of the accessible data table fallback',
    },
  ],
  props: [
    { name: 'chartTitle', attr: 'chart-title', type: 'string', default: '' },
    { name: 'subtitle', attr: 'subtitle', type: 'string', default: '' },
    { name: 'type', attr: 'type', type: 'MthChartType', default: 'line' },
    { name: 'renderer', attr: 'renderer', type: "'canvas' | 'svg'", default: 'canvas' },
    { name: 'size', attr: 'size', type: "'sm' | 'md' | 'lg' | 'full'", default: 'md' },
    { name: 'showLegend', attr: 'show-legend', type: 'boolean', default: true },
    { name: 'showTooltip', attr: 'show-tooltip', type: 'boolean', default: true },
    { name: 'showFallback', attr: 'show-fallback', type: 'boolean', default: false },
    { name: 'categoriesJson', attr: 'categories-json', type: 'string', default: '' },
    { name: 'categories', attr: false, type: 'ReadonlyArray<string>', default: undefined },
    { name: 'dataJson', attr: 'data-json', type: 'string', default: '' },
    { name: 'data', attr: false, type: 'ReadonlyArray<unknown>', default: undefined },
    { name: 'series', attr: false, type: 'ReadonlyArray<MthChartSeriesInput>', default: undefined },
    { name: 'option', attr: false, type: 'Record<string, unknown>', default: undefined },
    { name: 'loading', attr: 'loading', type: 'boolean', default: false },
    { name: 'empty', attr: 'empty', type: 'boolean', default: false },
  ],
  events: [
    { name: 'mth-chart-ready', cancelable: false, detailType: "{ renderer: 'canvas' | 'svg'; mode: 'echarts' | 'headless' }" },
    { name: 'mth-chart-render', cancelable: false, detailType: '{ seriesCount: number }' },
    { name: 'mth-point-select', cancelable: false, detailType: '{ seriesName: string; dataIndex: number; name: string; value: unknown }' },
  ],
  slots: [
    { name: '', description: 'Declarative `<mth-chart-series>` child elements.' },
    { name: 'fallback', description: 'SSR and screen-reader accessible data table fallback (`<table slot="fallback">`).' },
    { name: 'empty', description: 'Optional custom empty state.' },
  ],
  parts: [
    { name: 'base', description: 'Outer chart container.' },
    { name: 'header', description: 'Chart title, subtitle, and fallback table toggle toolbar.' },
    { name: 'title', description: 'Chart title text.' },
    { name: 'subtitle', description: 'Chart subtitle text.' },
    { name: 'toggle', description: 'Accessible button to toggle the data table fallback.' },
    { name: 'canvas', description: 'ECharts canvas/SVG mount container.' },
    { name: 'fallback', description: 'Container for the slotted data table fallback.' },
    { name: 'status', description: 'Loading or empty overlay status region.' },
  ],
  messages: chartMessages,
};

export const CEM_METADATA = {
  description:
    'Wrap-first Apache ECharts `<mth-chart>` visualization element supporting 19 chart types, declarative `<mth-chart-series>` children, `--mth-*` token palette sync, SSR `<table slot="fallback">`, and RTL/reduced-motion support.',
  propDescriptions: {
    chartTitle: 'Accessible chart heading displayed in the header and used as default ARIA label.',
    subtitle: 'Optional descriptive subtitle under the chart heading.',
    type: 'Default chart visualization type when providing direct `data` / `data-json` on `<mth-chart>`.',
    renderer: 'ECharts rendering backend (`canvas` or `svg`).',
    size: 'Preset block-size height (`sm`, `md`, `lg`, `full`).',
    showLegend: 'Controls visibility of the ECharts legend component.',
    showTooltip: 'Controls visibility of interactive chart tooltips.',
    showFallback: 'When true, visually reveals the slotted `<table slot="fallback">` content.',
    categoriesJson: 'JSON-encoded category axis labels array.',
    categories: 'Structured JS category axis labels array.',
    dataJson: 'JSON-encoded data array for single-series declarative usage.',
    data: 'Structured JS data array for single-series usage.',
    series: 'Programmatic series array supporting all 19 chart types.',
    option: 'Optional raw ECharts option overrides merged onto the generated configuration.',
    loading: 'Displays accessible loading state.',
    empty: 'Displays accessible empty state.',
  },
  eventDescriptions: {
    'mth-chart-ready': 'Emitted when the ECharts engine handle initializes.',
    'mth-chart-render': 'Emitted after chart options are applied to the engine.',
    'mth-point-select': 'Emitted when a data point is clicked in the chart.',
  },
  cssProperties: [
    { name: '--mth-color-surface', description: 'Surface background color.' },
    { name: '--mth-color-surface-raised', description: 'Raised control background color.' },
    { name: '--mth-color-fg', description: 'Primary text and label color.' },
    { name: '--mth-color-fg-muted', description: 'Muted subtitle and legend color.' },
    { name: '--mth-color-border', description: 'Container and button border color.' },
    { name: '--mth-color-border-focus', description: 'Keyboard focus ring color.' },
    { name: '--mth-color-accent', description: 'Primary series palette accent color.' },
  ],
};
