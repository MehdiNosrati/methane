import { defineComponents } from '@methane/core';
import { MthPdfViewer } from './pdf-viewer.js';

export {
  MthPdfViewer,
  type MthPdfEngineHandle,
  type PdfOutlineNode,
  type PdfZoomPreset,
} from './pdf-viewer.js';
export { pdfViewerMessages } from './pdf-viewer.messages.js';
export { pdfViewerSpec } from './pdf-viewer.spec.js';
export { pdfViewerStyles } from './pdf-viewer.styles.js';

export function registerMthPdfViewer(prefix?: string): ReadonlyArray<string> {
  return defineComponents({
    ...(prefix !== undefined ? { prefix } : {}),
    components: { 'mth-pdf-viewer': MthPdfViewer },
  });
}

declare global {
  interface HTMLElementTagNameMap {
    'mth-pdf-viewer': MthPdfViewer;
  }
}
