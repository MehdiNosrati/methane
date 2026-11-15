import { registerMthMegaMenu } from './element.js';

export * from './element.js';

registerMthMegaMenu();

declare global {
  interface HTMLElementTagNameMap {
    'mth-mega-menu': import('./mega-menu.js').MthMegaMenu;
  }
}
