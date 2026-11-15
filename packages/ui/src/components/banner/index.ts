import { registerMthBanner } from './element.js';
import type { MthBanner } from './banner.js';

registerMthBanner();

export * from './element.js';

declare global {
  interface HTMLElementTagNameMap {
    'mth-banner': MthBanner;
  }
}
