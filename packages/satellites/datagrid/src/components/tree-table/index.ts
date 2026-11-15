import { registerMthTreeTable } from './element.js';
import type { MthTreeTable } from './tree-table.js';

export * from './element.js';

registerMthTreeTable();

declare global {
  interface HTMLElementTagNameMap {
    'mth-tree-table': MthTreeTable;
  }
}
