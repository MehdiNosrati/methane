import { registerMthArtifactPane } from './element.js';

export * from './element.js';

registerMthArtifactPane();

declare global {
  interface HTMLElementTagNameMap {
    'mth-artifact-pane': import('./artifact-pane.js').MthArtifactPane;
  }
}
