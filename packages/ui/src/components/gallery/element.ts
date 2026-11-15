import { defineComponents } from '@methane/core';
import { MthGallery } from './gallery.js';

export { MthGallery, type GalleryItem } from './gallery.js';
export { galleryMessages, type GalleryMessages } from './gallery.messages.js';
export { gallerySpec } from './gallery.spec.js';
export { galleryStyles } from './gallery.styles.js';

export function registerMthGallery(prefix?: string): ReadonlyArray<string> {
  return defineComponents({
    ...(prefix !== undefined ? { prefix } : {}),
    components: { 'mth-gallery': MthGallery },
  });
}
