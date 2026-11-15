import { defineComponents } from '@methane-ui/core';
import { MthCookieBanner } from './cookie-banner.js';

export {
  MthCookieBanner,
  type CookieBannerPosition,
  type CookieConsentDetail,
} from './cookie-banner.js';
export { cookieBannerMessages } from './cookie-banner.messages.js';
export { cookieBannerSpec } from './cookie-banner.spec.js';
export { cookieBannerStyles } from './cookie-banner.styles.js';

export function registerMthCookieBanner(prefix?: string): ReadonlyArray<string> {
  return defineComponents({
    ...(prefix !== undefined ? { prefix } : {}),
    components: {
      'mth-cookie-banner': MthCookieBanner,
    },
  });
}
