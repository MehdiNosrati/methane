import { registerMthTable } from './element.js';

export * from './element.js';

registerMthTable();

declare global {
  interface HTMLElementTagNameMap {
    'mth-table': import('./table.js').MthTable;
  }
}
