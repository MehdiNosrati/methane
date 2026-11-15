import { defineComponents } from '@methane-ui/core';
import { MthMapDraw } from './map-draw.js';
import { mapDrawMessages } from './map-draw.messages.js';
import { mapDrawStyles } from './map-draw.styles.js';

export { MthMapDraw, mapDrawMessages, mapDrawStyles };
export type { DrawMode } from './map-draw.js';

export function registerMthMapDraw(prefix?: string): string {
  return defineComponents({
    ...(prefix ? { prefix } : {}),
    components: { 'mth-map-draw': MthMapDraw },
  })[0]!;
}

declare global {
  interface HTMLElementTagNameMap {
    'mth-map-draw': MthMapDraw;
  }
}
