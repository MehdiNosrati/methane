import { defineComponents } from '@methane-ui/core';
import { MthTourStep } from './tour-step.js';

export { MthTourStep } from './tour-step.js';
export { tourStepMessages } from './tour-step.messages.js';
export { tourStepStyles } from './tour-step.styles.js';

export function registerMthTourStep(prefix?: string): ReadonlyArray<string> {
  return defineComponents({
    ...(prefix !== undefined ? { prefix } : {}),
    components: {
      'mth-tour-step': MthTourStep,
    },
  });
}
