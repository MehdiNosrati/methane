import { defineComponents } from '@methane-ui/core';
import { MthReactionBar } from './reaction-bar.js';

export { MthReactionBar, type ReactionItem } from './reaction-bar.js';
export { reactionBarMessages, type ReactionBarMessages } from './reaction-bar.messages.js';
export { reactionBarStyles } from './reaction-bar.styles.js';

export function registerMthReactionBar(prefix?: string): ReadonlyArray<string> {
  return defineComponents({
    ...(prefix !== undefined ? { prefix } : {}),
    components: { 'mth-reaction-bar': MthReactionBar },
  });
}
