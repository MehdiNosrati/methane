import { defineComponents } from '@methane-ui/core';
import { MthScrollArea } from './scroll-area.js';

export {
  MthScrollArea,
  type MthScrollAreaOrientation,
  type MthScrollAreaType,
} from './scroll-area.js';
export { scrollAreaMessages } from './scroll-area.messages.js';
export { scrollAreaStyles } from './scroll-area.styles.js';

export function registerMthScrollArea(prefix?: string): ReadonlyArray<string> {
  return defineComponents({
    ...(prefix !== undefined ? { prefix } : {}),
    components: { 'mth-scroll-area': MthScrollArea },
  });
}
