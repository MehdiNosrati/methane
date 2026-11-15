import { defineComponents } from '@methane/core';
import { MthTourStep } from './tour-step.js';

export { MthTourStep } from './tour-step.js';
export { tourStepMessages } from './tour-step.messages.js';
export { CEM_METADATA, tourStepSpec } from './tour-step.spec.js';
export { tourStepStyles } from './tour-step.styles.js';

export function registerMthTourStep(prefix?: string): ReadonlyArray<string> {
  return defineComponents({
    ...(prefix !== undefined ? { prefix } : {}),
    components: {
      'mth-tour-step': MthTourStep,
    },
  });
}
