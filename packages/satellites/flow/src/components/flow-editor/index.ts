import { registerMthFlowEditor } from './element.js';

export * from './element.js';

registerMthFlowEditor();

declare global {
  interface HTMLElementTagNameMap {
    'mth-flow-editor': import('./flow-editor.js').MthFlowEditor;
  }
}
