import { defineComponents } from '@methane-ui/core';
import { MthProgressRing } from './progress-ring.js';

export { MthProgressRing } from './progress-ring.js';
export { progressRingMessages } from './progress-ring.messages.js';
export { progressRingSpec } from './progress-ring.spec.js';
export { progressRingStyles } from './progress-ring.styles.js';

export function registerMthProgressRing(prefix?: string): ReadonlyArray<string> {
  return defineComponents({
    ...(prefix !== undefined ? { prefix } : {}),
    components: {
      'mth-progress-ring': MthProgressRing,
    },
  });
}
