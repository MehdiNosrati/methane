import { registerMthCameraCapture } from './element.js';

export * from './element.js';

registerMthCameraCapture();

declare global {
  interface HTMLElementTagNameMap {
    'mth-camera-capture': import('./camera-capture.js').MthCameraCapture;
  }
}
