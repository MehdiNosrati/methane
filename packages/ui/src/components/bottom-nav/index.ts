import { registerMthBottomNav } from './element.js';

export * from './element.js';

registerMthBottomNav();

declare global {
  interface HTMLElementTagNameMap {
    'mth-bottom-nav': import('./bottom-nav.js').MthBottomNav;
  }
}
