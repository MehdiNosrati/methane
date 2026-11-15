import { defineComponents } from '@methane/core';
import { MthModelViewer } from './model-viewer.js';

export {
  MthModelViewer,
  type ModelRendererBackend,
  type MthModelEngineHandle,
} from './model-viewer.js';
export { modelViewerMessages } from './model-viewer.messages.js';
export { modelViewerSpec } from './model-viewer.spec.js';
export { modelViewerStyles } from './model-viewer.styles.js';

export function registerMthModelViewer(prefix?: string): ReadonlyArray<string> {
  return defineComponents({
    ...(prefix !== undefined ? { prefix } : {}),
    components: { 'mth-model-viewer': MthModelViewer },
  });
}

declare global {
  interface HTMLElementTagNameMap {
    'mth-model-viewer': MthModelViewer;
  }
}
