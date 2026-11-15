import { defineComponents } from '@methane/core';
import { MthZoomPan } from './zoom-pan.js';

export { MthZoomPan, type ZoomPanChangeDetail } from './zoom-pan.js';
export { zoomPanMessages, type ZoomPanMessages } from './zoom-pan.messages.js';
export { zoomPanSpec } from './zoom-pan.spec.js';
export { zoomPanStyles } from './zoom-pan.styles.js';

export function registerMthZoomPan(prefix?: string): ReadonlyArray<string> {
  return defineComponents({
    ...(prefix !== undefined ? { prefix } : {}),
    components: { 'mth-zoom-pan': MthZoomPan },
  });
}
