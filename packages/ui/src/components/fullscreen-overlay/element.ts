import { defineComponents } from '@methane/core';
import { MthFullscreenOverlay } from './fullscreen-overlay.js';

export { MthFullscreenOverlay } from './fullscreen-overlay.js';
export { fullscreenOverlayMessages } from './fullscreen-overlay.messages.js';
export { CEM_METADATA, fullscreenOverlaySpec } from './fullscreen-overlay.spec.js';
export { fullscreenOverlayStyles } from './fullscreen-overlay.styles.js';

export function registerMthFullscreenOverlay(prefix?: string): ReadonlyArray<string> {
  return defineComponents({
    ...(prefix !== undefined ? { prefix } : {}),
    components: {
      'mth-fullscreen-overlay': MthFullscreenOverlay,
    },
  });
}
