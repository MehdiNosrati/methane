import { defineComponents } from '@methane-ui/core';
import { MthCallout } from './callout.js';

export { MthCallout, type CalloutVariant } from './callout.js';
export { calloutMessages } from './callout.messages.js';
export { calloutSpec } from './callout.spec.js';
export { calloutStyles } from './callout.styles.js';

export function registerMthCallout(prefix?: string): ReadonlyArray<string> {
  return defineComponents({
    ...(prefix !== undefined ? { prefix } : {}),
    components: {
      'mth-callout': MthCallout,
    },
  });
}
