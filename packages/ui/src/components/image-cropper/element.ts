import { defineComponents } from '@methane-ui/core';
import { MthImageCropper } from './image-cropper.js';

export function registerMthImageCropper(prefix?: string): ReadonlyArray<string> {
  return defineComponents({
    ...(prefix !== undefined ? { prefix } : {}),
    components: { 'mth-image-cropper': MthImageCropper },
  });
}

export { MthImageCropper, type CropResult } from './image-cropper.js';
export { imageCropperMessages } from './image-cropper.messages.js';
export { imageCropperStyles } from './image-cropper.styles.js';
