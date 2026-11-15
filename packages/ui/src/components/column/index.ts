import { registerMthColumn } from './element.js';

export * from './element.js';

registerMthColumn();

declare global {
  interface HTMLElementTagNameMap {
    'mth-column': import('./column.js').MthColumn;
  }
}
