import { defineComponents } from '@methane-ui/core';
import { MthZoomPan } from './zoom-pan.js';

export { MthZoomPan, type ZoomPanChangeDetail } from './zoom-pan.js';
export { zoomPanMessages, type ZoomPanMessages } from './zoom-pan.messages.js';
export { zoomPanStyles } from './zoom-pan.styles.js';

export function registerMthZoomPan(prefix?: string): ReadonlyArray<string> {
  return defineComponents({
    ...(prefix !== undefined ? { prefix } : {}),
    components: { 'mth-zoom-pan': MthZoomPan },
  });
}
