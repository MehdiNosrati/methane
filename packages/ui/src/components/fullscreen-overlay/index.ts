import { registerMthFullscreenOverlay } from './element.js';
import type { MthFullscreenOverlay } from './fullscreen-overlay.js';

registerMthFullscreenOverlay();

export * from './element.js';

declare global {
  interface HTMLElementTagNameMap {
    'mth-fullscreen-overlay': MthFullscreenOverlay;
  }
}
