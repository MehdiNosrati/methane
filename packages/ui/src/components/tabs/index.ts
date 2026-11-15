import { registerMthTabs } from './element.js';

export * from './element.js';

registerMthTabs();

declare global {
  interface HTMLElementTagNameMap {
    'mth-tabs': import('./tabs.js').MthTabs;
  }
}
