import { defineComponents } from '@methane/core';
import { MthAccordion } from './accordion.js';

export { MthAccordion } from './accordion.js';
export { accordionMessages } from './accordion.messages.js';
export { accordionSpec } from './accordion.spec.js';
export { accordionStyles } from './accordion.styles.js';

export function registerMthAccordion(prefix?: string): ReadonlyArray<string> {
  return defineComponents({
    ...(prefix !== undefined ? { prefix } : {}),
    components: { 'mth-accordion': MthAccordion },
  });
}
