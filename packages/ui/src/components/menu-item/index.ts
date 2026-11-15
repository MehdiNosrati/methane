import { registerMthMenuItem } from './element.js';

export * from './element.js';

registerMthMenuItem();

declare global {
  interface HTMLElementTagNameMap {
    'mth-menu-item': import('./menu-item.js').MthMenuItem;
  }
}
