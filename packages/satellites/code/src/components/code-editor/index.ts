import { registerMthCodeEditor } from './element.js';

export * from './element.js';

registerMthCodeEditor();

declare global {
  interface HTMLElementTagNameMap {
    'mth-code-editor': import('./code-editor.js').MthCodeEditor;
  }
}
