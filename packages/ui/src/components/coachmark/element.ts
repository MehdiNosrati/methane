import { defineComponents } from '@methane/core';
import { MthCoachmark } from './coachmark.js';

export { MthCoachmark } from './coachmark.js';
export { coachmarkMessages } from './coachmark.messages.js';
export { CEM_METADATA, coachmarkSpec } from './coachmark.spec.js';
export { coachmarkStyles } from './coachmark.styles.js';

export function registerMthCoachmark(prefix?: string): ReadonlyArray<string> {
  return defineComponents({
    ...(prefix !== undefined ? { prefix } : {}),
    components: {
      'mth-coachmark': MthCoachmark,
    },
  });
}
