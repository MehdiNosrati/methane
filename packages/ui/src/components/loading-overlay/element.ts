import { defineComponents } from '@methane-ui/core';
import { MthLoadingOverlay } from './loading-overlay.js';

export { MthLoadingOverlay } from './loading-overlay.js';
export { loadingOverlayMessages } from './loading-overlay.messages.js';
export { loadingOverlayStyles } from './loading-overlay.styles.js';

export function registerMthLoadingOverlay(prefix?: string): ReadonlyArray<string> {
  return defineComponents({
    ...(prefix !== undefined ? { prefix } : {}),
    components: {
      'mth-loading-overlay': MthLoadingOverlay,
    },
  });
}
