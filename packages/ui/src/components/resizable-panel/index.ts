import { registerMthResizablePanel } from './element.js';

export * from './element.js';

registerMthResizablePanel();

declare global {
  interface HTMLElementTagNameMap {
    'mth-resizable-panel': import('./resizable-panel.js').MthResizablePanel;
  }
}
