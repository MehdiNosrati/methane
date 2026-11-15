import { registerMthRichEditor } from './element.js';

export * from './element.js';

registerMthRichEditor();

declare global {
  interface HTMLElementTagNameMap {
    'mth-rich-editor': import('./rich-editor.js').MthRichEditor;
  }
}
