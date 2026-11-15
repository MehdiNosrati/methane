import { registerMthComparisonTable } from './element.js';

export * from './element.js';

registerMthComparisonTable();

declare global {
  interface HTMLElementTagNameMap {
    'mth-comparison-table': import('./comparison-table.js').MthComparisonTable;
  }
}
