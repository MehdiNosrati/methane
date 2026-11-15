import { defineComponents } from '@methane-ui/core';
import { MthFullscreenOverlay } from './fullscreen-overlay.js';

export { MthFullscreenOverlay } from './fullscreen-overlay.js';
export { fullscreenOverlayMessages } from './fullscreen-overlay.messages.js';
export { fullscreenOverlayStyles } from './fullscreen-overlay.styles.js';

export function registerMthFullscreenOverlay(prefix?: string): ReadonlyArray<string> {
  return defineComponents({
    ...(prefix !== undefined ? { prefix } : {}),
    components: {
      'mth-fullscreen-overlay': MthFullscreenOverlay,
    },
  });
}
