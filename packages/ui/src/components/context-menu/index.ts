import { registerMthContextMenu } from './element.js';

export * from './element.js';

registerMthContextMenu();

declare global {
  interface HTMLElementTagNameMap {
    'mth-context-menu': import('./context-menu.js').MthContextMenu;
  }
}
