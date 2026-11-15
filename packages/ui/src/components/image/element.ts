import { defineComponents } from '@methane-ui/core';
import { MthImage } from './image.js';

export { MthImage, type MthImageDecoding, type MthImageFit, type MthImageLoading } from './image.js';
export { imageMessages, type ImageMessages } from './image.messages.js';
export { imageSpec } from './image.spec.js';
export { imageStyles } from './image.styles.js';

export function registerMthImage(prefix?: string): ReadonlyArray<string> {
  return defineComponents({
    ...(prefix !== undefined ? { prefix } : {}),
    components: { 'mth-image': MthImage },
  });
}
