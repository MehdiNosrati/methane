import { defineComponents } from '@methane-ui/core';
import { MthTour } from './tour.js';

export { MthTour } from './tour.js';
export { tourMessages } from './tour.messages.js';
export { tourSpec } from './tour.spec.js';
export { tourStyles } from './tour.styles.js';

export function registerMthTour(prefix?: string): ReadonlyArray<string> {
  return defineComponents({
    ...(prefix !== undefined ? { prefix } : {}),
    components: {
      'mth-tour': MthTour,
    },
  });
}
