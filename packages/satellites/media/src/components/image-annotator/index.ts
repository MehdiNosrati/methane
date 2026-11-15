import { registerMthImageAnnotator } from './element.js';

export * from './element.js';

registerMthImageAnnotator();

declare global {
  interface HTMLElementTagNameMap {
    'mth-image-annotator': import('./image-annotator.js').MthImageAnnotator;
  }
}
