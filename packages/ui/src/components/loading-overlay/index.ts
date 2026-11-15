import { registerMthLoadingOverlay } from './element.js';
import type { MthLoadingOverlay } from './loading-overlay.js';

registerMthLoadingOverlay();

export * from './element.js';

declare global {
  interface HTMLElementTagNameMap {
    'mth-loading-overlay': MthLoadingOverlay;
  }
}
