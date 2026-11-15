import { defineComponents } from '@methane-ui/core';
import { MthBadge } from './badge.js';

export { MthBadge, type MthBadgeSize, type MthBadgeVariant } from './badge.js';
export { badgeMessages } from './badge.messages.js';
export { badgeSpec } from './badge.spec.js';
export { badgeStyles } from './badge.styles.js';

export function registerMthBadge(prefix?: string): ReadonlyArray<string> {
  return defineComponents({
    ...(prefix !== undefined ? { prefix } : {}),
    components: { 'mth-badge': MthBadge },
  });
}
