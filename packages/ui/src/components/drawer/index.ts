import { registerMthDrawer } from './element.js';

export * from './element.js';

registerMthDrawer();

declare global {
  interface HTMLElementTagNameMap {
    'mth-drawer': import('./drawer.js').MthDrawer;
  }
}
