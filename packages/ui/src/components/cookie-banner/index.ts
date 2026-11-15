import { registerMthCookieBanner } from './element.js';
import type { MthCookieBanner } from './cookie-banner.js';

registerMthCookieBanner();

export * from './element.js';

declare global {
  interface HTMLElementTagNameMap {
    'mth-cookie-banner': MthCookieBanner;
  }
}
