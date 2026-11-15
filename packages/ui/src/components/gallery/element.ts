import { defineComponents } from '@methane-ui/core';
import { MthGallery } from './gallery.js';

export { MthGallery, type GalleryItem } from './gallery.js';
export { galleryMessages, type GalleryMessages } from './gallery.messages.js';
export { galleryStyles } from './gallery.styles.js';

export function registerMthGallery(prefix?: string): ReadonlyArray<string> {
  return defineComponents({
    ...(prefix !== undefined ? { prefix } : {}),
    components: { 'mth-gallery': MthGallery },
  });
}
