import { registerMthSplitPane } from './element.js';

export * from './element.js';

registerMthSplitPane();

declare global {
  interface HTMLElementTagNameMap {
    'mth-split-pane': import('./split-pane.js').MthSplitPane;
  }
}
