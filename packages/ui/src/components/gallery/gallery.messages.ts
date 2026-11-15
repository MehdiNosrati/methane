export const galleryMessages = {
  galleryLabel: 'Media gallery',
  thumbnailsLabel: 'Gallery thumbnails',
  openLightboxLabel: 'Open full view for',
} as const satisfies Record<string, string>;

export type GalleryMessages = typeof galleryMessages;
