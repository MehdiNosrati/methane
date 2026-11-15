import { defineComponents } from '@methane-ui/core';
import { MthComparisonTable } from './comparison-table.js';

export {
  MthComparisonTable,
  type ComparisonPlan,
  type ComparisonRow,
} from './comparison-table.js';
export { comparisonTableMessages } from './comparison-table.messages.js';
export { comparisonTableStyles } from './comparison-table.styles.js';

export function registerMthComparisonTable(prefix?: string): ReadonlyArray<string> {
  return defineComponents({
    ...(prefix !== undefined ? { prefix } : {}),
    components: { 'mth-comparison-table': MthComparisonTable },
  });
}
