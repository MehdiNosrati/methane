import { registerMthJsonEditor } from './element.js';

export * from './element.js';

registerMthJsonEditor();

declare global {
  interface HTMLElementTagNameMap {
    'mth-json-editor': import('./json-editor.js').MthJsonEditor;
  }
}
