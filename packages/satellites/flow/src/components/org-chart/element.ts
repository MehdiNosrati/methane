import { defineComponents } from '@methane/core';
import { MthOrgChart } from './org-chart.js';

export {
  MthOrgChart,
  type OrgChartDirection,
  type OrgChartEngine,
  type OrgChartNode,
  type OrgConnector,
  type PositionedOrgCard,
} from './org-chart.js';

export function registerMthOrgChart(prefix?: string): ReadonlyArray<string> {
  return defineComponents({
    ...(prefix !== undefined ? { prefix } : {}),
    components: {
      'mth-org-chart': MthOrgChart,
    },
  });
}

registerMthOrgChart();
