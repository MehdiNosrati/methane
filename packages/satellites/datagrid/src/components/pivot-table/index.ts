import { registerMthPivotTable } from './element.js';
import type { MthPivotTable } from './pivot-table.js';

export * from './element.js';

registerMthPivotTable();

declare global {
  interface HTMLElementTagNameMap {
    'mth-pivot-table': MthPivotTable;
  }
}
