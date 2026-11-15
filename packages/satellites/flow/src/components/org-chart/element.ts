import { defineComponents } from '@methane-ui/core';
import { MthOrgChart } from './org-chart.js';

export {
  MthOrgChart,
  type OrgChartDirection,
  type OrgChartEngine,
  type OrgChartNode,
  type OrgConnector,
  type PositionedOrgCard,
} from './org-chart.js';
export { orgChartMessages } from './org-chart.messages.js';
export { orgChartStyles } from './org-chart.styles.js';

export function registerMthOrgChart(prefix?: string): ReadonlyArray<string> {
  return defineComponents({
    ...(prefix !== undefined ? { prefix } : {}),
    components: {
      'mth-org-chart': MthOrgChart,
    },
  });
}
