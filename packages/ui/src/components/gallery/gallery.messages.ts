export const galleryMessages = {
  galleryLabel: 'Media gallery',
  thumbnailsLabel: 'Gallery thumbnails',
  openLightboxLabel: 'Open full view for',
  itemLabel: 'Item {index}',
  thumbnailLabel: 'Thumbnail {index}',
} as const satisfies Record<string, string>;

export type GalleryMessages = typeof galleryMessages;
