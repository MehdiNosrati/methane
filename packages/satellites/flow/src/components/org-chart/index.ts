import { registerMthOrgChart } from './element.js';

export * from './element.js';

registerMthOrgChart();

declare global {
  interface HTMLElementTagNameMap {
    'mth-org-chart': import('./org-chart.js').MthOrgChart;
  }
}
