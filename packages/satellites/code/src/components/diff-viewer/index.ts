import { registerMthDiffViewer } from './element.js';

export * from './element.js';

registerMthDiffViewer();

declare global {
  interface HTMLElementTagNameMap {
    'mth-diff-viewer': import('./diff-viewer.js').MthDiffViewer;
  }
}
