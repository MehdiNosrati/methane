import { registerMthVideoGrid } from './element.js';

export * from './element.js';

registerMthVideoGrid();

declare global {
  interface HTMLElementTagNameMap {
    'mth-video-grid': import('./video-grid.js').MthVideoGrid;
  }
}
