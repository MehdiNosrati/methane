import { registerMthTabPanel } from './element.js';

export * from './element.js';

registerMthTabPanel();

declare global {
  interface HTMLElementTagNameMap {
    'mth-tab-panel': import('./tab-panel.js').MthTabPanel;
  }
}
