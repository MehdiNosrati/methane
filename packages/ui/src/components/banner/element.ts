import { defineComponents } from '@methane-ui/core';
import { MthBanner } from './banner.js';

export { MthBanner, type BannerVariant } from './banner.js';
export { bannerMessages } from './banner.messages.js';
export { bannerStyles } from './banner.styles.js';

export function registerMthBanner(prefix?: string): ReadonlyArray<string> {
  return defineComponents({
    ...(prefix !== undefined ? { prefix } : {}),
    components: {
      'mth-banner': MthBanner,
    },
  });
}
