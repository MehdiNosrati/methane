import { registerMthImageCropper } from './element.js';

export * from './element.js';

registerMthImageCropper();

declare global {
  interface HTMLElementTagNameMap {
    'mth-image-cropper': import('./image-cropper.js').MthImageCropper;
  }
}
