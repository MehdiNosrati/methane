import { defineComponents } from '@methane-ui/core';
import { MthPivotTable } from './pivot-table.js';

export {
  MthPivotTable,
  type MthPivotTableEngine,
  type PivotAggregator,
  type PivotGroupSummary,
  type PivotMatrix,
} from './pivot-table.js';
export { pivotTableMessages } from './pivot-table.messages.js';
export { pivotTableStyles } from './pivot-table.styles.js';

export function registerMthPivotTable(prefix?: string): ReadonlyArray<string> {
  return defineComponents({
    ...(prefix !== undefined ? { prefix } : {}),
    components: { 'mth-pivot-table': MthPivotTable },
  });
}
