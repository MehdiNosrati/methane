import { registerMthTreeItem } from './element.js';

export * from './element.js';

registerMthTreeItem();

declare global {
  interface HTMLElementTagNameMap {
    'mth-tree-item': import('./tree-item.js').MthTreeItem;
  }
}
