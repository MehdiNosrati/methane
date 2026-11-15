import { registerMthLink } from './element.js';

export * from './element.js';

registerMthLink();

declare global {
  interface HTMLElementTagNameMap {
    'mth-link': import('./link.js').MthLink;
  }
}
