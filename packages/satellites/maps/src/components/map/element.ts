import { defineComponents } from '@methane-ui/core';
import { MthMap } from './map.js';
import { mapMessages } from './map.messages.js';
import { mapSpec } from './map.spec.js';
import { mapStyles } from './map.styles.js';

export { MthMap, mapMessages, mapSpec, mapStyles };
export type { MapMarker } from './map.js';

export function registerMthMap(prefix?: string): string {
  return defineComponents({
    ...(prefix ? { prefix } : {}),
    components: { 'mth-map': MthMap },
  })[0]!;
}

declare global {
  interface HTMLElementTagNameMap {
    'mth-map': MthMap;
  }
}
