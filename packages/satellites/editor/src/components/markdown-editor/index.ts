import { registerMthMarkdownEditor } from './element.js';

export * from './element.js';

registerMthMarkdownEditor();

declare global {
  interface HTMLElementTagNameMap {
    'mth-markdown-editor': import('./markdown-editor.js').MthMarkdownEditor;
  }
}
