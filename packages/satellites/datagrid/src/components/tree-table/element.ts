import { defineComponents } from '@methane-ui/core';
import { MthTreeTable } from './tree-table.js';

export {
  MthTreeTable,
  type MthTreeTableEngine,
  type TreeTableColumn,
  type TreeTableRow,
} from './tree-table.js';
export { treeTableMessages } from './tree-table.messages.js';
export { treeTableSpec } from './tree-table.spec.js';
export { treeTableStyles } from './tree-table.styles.js';

export function registerMthTreeTable(prefix?: string): ReadonlyArray<string> {
  return defineComponents({
    ...(prefix !== undefined ? { prefix } : {}),
    components: { 'mth-tree-table': MthTreeTable },
  });
}
