import { defineComponents } from '@methane-ui/core';
import { MthChart } from './chart.js';

export {
  MthChart,
  mapMthChartTypeToEChartsSeries,
  type MthChartEngineHandle,
  type MthChartSeriesInput,
} from './chart.js';
export { chartMessages } from './chart.messages.js';
export { chartSpec } from './chart.spec.js';
export { chartStyles } from './chart.styles.js';

export function registerMthChart(prefix?: string): ReadonlyArray<string> {
  return defineComponents({
    ...(prefix !== undefined ? { prefix } : {}),
    components: { 'mth-chart': MthChart },
  });
}

declare global {
  interface HTMLElementTagNameMap {
    'mth-chart': MthChart;
  }
}
