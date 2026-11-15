import { defineComponents } from '@methane/core';
import { MthFileUpload } from './file-upload.js';

export function registerMthFileUpload(prefix?: string): ReadonlyArray<string> {
  return defineComponents({
    ...(prefix !== undefined ? { prefix } : {}),
    components: { 'mth-file-upload': MthFileUpload },
  });
}

export { MthFileUpload, type FileRejectReason, type RejectedFile } from './file-upload.js';
export { fileUploadMessages } from './file-upload.messages.js';
export { fileUploadSpec } from './file-upload.spec.js';
export { fileUploadStyles } from './file-upload.styles.js';
