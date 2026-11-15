import { registerMthProfileMenu } from './element.js';

export * from './element.js';

registerMthProfileMenu();

declare global {
  interface HTMLElementTagNameMap {
    'mth-profile-menu': import('./profile-menu.js').MthProfileMenu;
  }
}
