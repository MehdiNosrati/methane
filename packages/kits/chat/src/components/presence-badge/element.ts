import { defineComponents } from '@methane-ui/core';
import { MthPresenceBadge } from './presence-badge.js';

export {
  MthPresenceBadge,
  type MthPresenceSize,
  type MthPresenceStatus,
} from './presence-badge.js';
export { presenceBadgeMessages, type PresenceBadgeMessages } from './presence-badge.messages.js';
export { presenceBadgeStyles } from './presence-badge.styles.js';

export function registerMthPresenceBadge(prefix?: string): ReadonlyArray<string> {
  return defineComponents({
    ...(prefix !== undefined ? { prefix } : {}),
    components: { 'mth-presence-badge': MthPresenceBadge },
  });
}
