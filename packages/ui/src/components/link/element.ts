import { defineComponents } from '@methane-ui/core';
import { MthLink } from './link.js';

export { MthLink, type MthLinkUnderline } from './link.js';
export { linkMessages } from './link.messages.js';
export { linkSpec } from './link.spec.js';
export { linkStyles } from './link.styles.js';

export function registerMthLink(prefix?: string): ReadonlyArray<string> {
  return defineComponents({
    ...(prefix !== undefined ? { prefix } : {}),
    components: { 'mth-link': MthLink },
  });
}
