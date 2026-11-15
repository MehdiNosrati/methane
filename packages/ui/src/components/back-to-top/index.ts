import { registerMthBackToTop } from './element.js';

export * from './element.js';

registerMthBackToTop();

declare global {
  interface HTMLElementTagNameMap {
    'mth-back-to-top': import('./back-to-top.js').MthBackToTop;
  }
}
