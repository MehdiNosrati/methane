import { registerMthMathEditor } from './element.js';

export * from './element.js';

registerMthMathEditor();

declare global {
  interface HTMLElementTagNameMap {
    'mth-math-editor': import('./math-editor.js').MthMathEditor;
  }
}
