import { registerMthSortable } from './element.js';

export * from './element.js';

registerMthSortable();

declare global {
  interface HTMLElementTagNameMap {
    'mth-sortable': import('./sortable.js').MthSortable;
  }
}
