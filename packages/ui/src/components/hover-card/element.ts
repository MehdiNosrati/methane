import { defineComponents } from '@methane-ui/core';
import { MthHoverCard } from './hover-card.js';

export { MthHoverCard } from './hover-card.js';
export { hoverCardMessages } from './hover-card.messages.js';
export { hoverCardStyles } from './hover-card.styles.js';

export function registerMthHoverCard(prefix?: string): ReadonlyArray<string> {
  return defineComponents({
    ...(prefix !== undefined ? { prefix } : {}),
    components: { 'mth-hover-card': MthHoverCard },
  });
}
