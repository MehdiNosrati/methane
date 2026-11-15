import { defineComponents } from '@methane-ui/core';
import { MthDropzone } from './dropzone.js';

export function registerMthDropzone(prefix?: string): ReadonlyArray<string> {
  return defineComponents({
    ...(prefix !== undefined ? { prefix } : {}),
    components: { 'mth-dropzone': MthDropzone },
  });
}

export { MthDropzone, type DropRejectReason, type DropRejectedFile } from './dropzone.js';
export { dropzoneMessages } from './dropzone.messages.js';
export { dropzoneSpec } from './dropzone.spec.js';
export { dropzoneStyles } from './dropzone.styles.js';
