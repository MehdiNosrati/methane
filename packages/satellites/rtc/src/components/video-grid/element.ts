import { defineComponents } from '@methane-ui/core';
import { MthVideoGrid } from './video-grid.js';

export {
  MthVideoGrid,
  type VideoGridEngine,
  type VideoGridLayout,
  type VideoParticipant,
} from './video-grid.js';

export function registerMthVideoGrid(prefix?: string): ReadonlyArray<string> {
  return defineComponents({
    ...(prefix !== undefined ? { prefix } : {}),
    components: {
      'mth-video-grid': MthVideoGrid,
    },
  });
}

registerMthVideoGrid();
