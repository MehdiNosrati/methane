import { defineComponents } from '@methane-ui/core';
import { MthVideoGrid } from './video-grid.js';

export {
  MthVideoGrid,
  type VideoGridEngine,
  type VideoGridLayout,
  type VideoParticipant,
} from './video-grid.js';
export { videoGridMessages } from './video-grid.messages.js';
export { videoGridStyles } from './video-grid.styles.js';

export function registerMthVideoGrid(prefix?: string): ReadonlyArray<string> {
  return defineComponents({
    ...(prefix !== undefined ? { prefix } : {}),
    components: {
      'mth-video-grid': MthVideoGrid,
    },
  });
}
