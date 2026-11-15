import { registerMthFileUpload } from './element.js';

export * from './element.js';

registerMthFileUpload();

declare global {
  interface HTMLElementTagNameMap {
    'mth-file-upload': import('./file-upload.js').MthFileUpload;
  }
}
