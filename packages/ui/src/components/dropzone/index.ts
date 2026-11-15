import { registerMthDropzone } from './element.js';

export * from './element.js';

registerMthDropzone();

declare global {
  interface HTMLElementTagNameMap {
    'mth-dropzone': import('./dropzone.js').MthDropzone;
  }
}
