import { defineComponents } from '@methane-ui/core';
import { MthBeforeAfter } from './before-after.js';

export { MthBeforeAfter } from './before-after.js';
export { beforeAfterMessages, type BeforeAfterMessages } from './before-after.messages.js';
export { beforeAfterSpec } from './before-after.spec.js';
export { beforeAfterStyles } from './before-after.styles.js';

export function registerMthBeforeAfter(prefix?: string): ReadonlyArray<string> {
  return defineComponents({
    ...(prefix !== undefined ? { prefix } : {}),
    components: { 'mth-before-after': MthBeforeAfter },
  });
}
