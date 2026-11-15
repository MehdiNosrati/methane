import { registerMthTree } from './element.js';

export * from './element.js';

registerMthTree();

declare global {
  interface HTMLElementTagNameMap {
    'mth-tree': import('./tree.js').MthTree;
  }
}
