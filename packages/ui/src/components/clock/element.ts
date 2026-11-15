import { defineComponents } from '@methane-ui/core';
import { MthClock } from './clock.js';

export { MthClock } from './clock.js';
export { clockMessages } from './clock.messages.js';
export { clockSpec } from './clock.spec.js';
export { clockStyles } from './clock.styles.js';

export function registerMthClock(prefix?: string): ReadonlyArray<string> {
  return defineComponents({
    ...(prefix !== undefined ? { prefix } : {}),
    components: { 'mth-clock': MthClock },
  });
}
