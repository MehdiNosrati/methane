import { registerMthTreeNav } from './element.js';

export * from './element.js';

registerMthTreeNav();

declare global {
  interface HTMLElementTagNameMap {
    'mth-tree-nav': import('./tree-nav.js').MthTreeNav;
  }
}
