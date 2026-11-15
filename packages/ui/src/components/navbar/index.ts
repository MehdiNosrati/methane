import { registerMthNavbar } from './element.js';

export * from './element.js';

registerMthNavbar();

declare global {
  interface HTMLElementTagNameMap {
    'mth-navbar': import('./navbar.js').MthNavbar;
  }
}
