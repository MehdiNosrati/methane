import { registerMthDropdownMenu } from './element.js';

export * from './element.js';

registerMthDropdownMenu();

declare global {
  interface HTMLElementTagNameMap {
    'mth-dropdown-menu': import('./dropdown-menu.js').MthDropdownMenu;
  }
}
