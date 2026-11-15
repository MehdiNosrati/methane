import { registerMthMasonry } from './element.js';

export * from './element.js';

registerMthMasonry();

declare global {
  interface HTMLElementTagNameMap {
    'mth-masonry': import('./masonry.js').MthMasonry;
  }
}
