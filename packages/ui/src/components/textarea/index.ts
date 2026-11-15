import { registerMthTextarea } from './element.js';

export * from './element.js';

registerMthTextarea();

declare global {
  interface HTMLElementTagNameMap {
    'mth-textarea': import('./textarea.js').MthTextarea;
  }
}
