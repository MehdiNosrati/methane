import { registerMthTag } from './element.js';

export * from './element.js';

registerMthTag();

declare global {
  interface HTMLElementTagNameMap {
    'mth-tag': import('./tag.js').MthTag;
  }
}
