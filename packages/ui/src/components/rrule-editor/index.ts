import { registerMthRruleEditor } from './element.js';

export * from './element.js';

registerMthRruleEditor();

declare global {
  interface HTMLElementTagNameMap {
    'mth-rrule-editor': import('./rrule-editor.js').MthRruleEditor;
  }
}
