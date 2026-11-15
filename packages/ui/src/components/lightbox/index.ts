import { registerMthLightbox } from './element.js';

export * from './element.js';

registerMthLightbox();

declare global {
  interface HTMLElementTagNameMap {
    'mth-lightbox': import('./lightbox.js').MthLightbox;
  }
}
