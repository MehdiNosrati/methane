import { defineComponents } from '@methane/core';
import { MthChartSeries } from './chart-series.js';

export { MTH_CHART_TYPES, MthChartSeries, type MthChartType } from './chart-series.js';
export { chartSeriesMessages } from './chart-series.messages.js';
export { chartSeriesSpec } from './chart-series.spec.js';
export { chartSeriesStyles } from './chart-series.styles.js';

export function registerMthChartSeries(prefix?: string): ReadonlyArray<string> {
  return defineComponents({
    ...(prefix !== undefined ? { prefix } : {}),
    components: { 'mth-chart-series': MthChartSeries },
  });
}

declare global {
  interface HTMLElementTagNameMap {
    'mth-chart-series': MthChartSeries;
  }
}
