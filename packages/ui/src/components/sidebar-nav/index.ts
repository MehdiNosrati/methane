import { registerMthSidebarNav } from './element.js';

export * from './element.js';

registerMthSidebarNav();

declare global {
  interface HTMLElementTagNameMap {
    'mth-sidebar-nav': import('./sidebar-nav.js').MthSidebarNav;
  }
}
