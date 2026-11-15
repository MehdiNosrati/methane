import { defineComponents } from '@methane/core';
import { MthTable } from './table.js';

export {
  MthTable,
  type MthTableSelectable,
  type TableColumnConfig,
  type TableRowRecord,
} from './table.js';
export { tableMessages } from './table.messages.js';
export { tableSpec } from './table.spec.js';
export { tableStyles } from './table.styles.js';

export function registerMthTable(prefix?: string): ReadonlyArray<string> {
  return defineComponents({
    ...(prefix !== undefined ? { prefix } : {}),
    components: { 'mth-table': MthTable },
  });
}
