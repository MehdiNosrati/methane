import { registerMthScrollArea } from './element.js';

export * from './element.js';

registerMthScrollArea();

declare global {
  interface HTMLElementTagNameMap {
    'mth-scroll-area': import('./scroll-area.js').MthScrollArea;
  }
}
