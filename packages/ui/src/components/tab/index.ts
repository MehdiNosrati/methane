import { registerMthTab } from './element.js';

export * from './element.js';

registerMthTab();

declare global {
  interface HTMLElementTagNameMap {
    'mth-tab': import('./tab.js').MthTab;
  }
}
