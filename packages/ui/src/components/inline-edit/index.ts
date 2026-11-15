import { registerMthInlineEdit } from './element.js';

export * from './element.js';

registerMthInlineEdit();

declare global {
  interface HTMLElementTagNameMap {
    'mth-inline-edit': import('./inline-edit.js').MthInlineEdit;
  }
}
