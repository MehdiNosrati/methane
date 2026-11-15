import { registerMthUploadProgress } from './element.js';
import type { MthUploadProgress } from './upload-progress.js';

registerMthUploadProgress();

export * from './element.js';

declare global {
  interface HTMLElementTagNameMap {
    'mth-upload-progress': MthUploadProgress;
  }
}
