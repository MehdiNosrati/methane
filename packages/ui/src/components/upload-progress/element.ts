import { defineComponents } from '@methane/core';
import { MthUploadProgress } from './upload-progress.js';

export { MthUploadProgress, type UploadProgressStatus } from './upload-progress.js';
export { uploadProgressMessages } from './upload-progress.messages.js';
export { uploadProgressSpec } from './upload-progress.spec.js';
export { uploadProgressStyles } from './upload-progress.styles.js';

export function registerMthUploadProgress(prefix?: string): ReadonlyArray<string> {
  return defineComponents({
    ...(prefix !== undefined ? { prefix } : {}),
    components: {
      'mth-upload-progress': MthUploadProgress,
    },
  });
}
