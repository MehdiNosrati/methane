import { registerMthListItem } from './element.js';

export * from './element.js';

registerMthListItem();

declare global {
  interface HTMLElementTagNameMap {
    'mth-list-item': import('./list-item.js').MthListItem;
  }
}
