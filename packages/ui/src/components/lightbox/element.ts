import { defineComponents } from '@methane-ui/core';
import { MthLightbox } from './lightbox.js';

export { MthLightbox, type MthLightboxItem } from './lightbox.js';
export { lightboxMessages } from './lightbox.messages.js';
export { lightboxSpec } from './lightbox.spec.js';
export { lightboxStyles } from './lightbox.styles.js';

export function registerMthLightbox(prefix?: string): ReadonlyArray<string> {
  return defineComponents({
    ...(prefix !== undefined ? { prefix } : {}),
    components: { 'mth-lightbox': MthLightbox },
  });
}
