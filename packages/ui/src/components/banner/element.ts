import { defineComponents } from '@methane/core';
import { MthBanner } from './banner.js';

export { MthBanner, type BannerVariant } from './banner.js';
export { bannerMessages } from './banner.messages.js';
export { bannerSpec } from './banner.spec.js';
export { bannerStyles } from './banner.styles.js';

export function registerMthBanner(prefix?: string): ReadonlyArray<string> {
  return defineComponents({
    ...(prefix !== undefined ? { prefix } : {}),
    components: {
      'mth-banner': MthBanner,
    },
  });
}
