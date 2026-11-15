import { defineComponents } from '@methane-ui/core';
import { MthMasonry } from './masonry.js';

export { MthMasonry } from './masonry.js';
export { masonryMessages } from './masonry.messages.js';
export { masonrySpec } from './masonry.spec.js';
export { masonryStyles } from './masonry.styles.js';

export function registerMthMasonry(prefix?: string): ReadonlyArray<string> {
  return defineComponents({
    ...(prefix !== undefined ? { prefix } : {}),
    components: { 'mth-masonry': MthMasonry },
  });
}
