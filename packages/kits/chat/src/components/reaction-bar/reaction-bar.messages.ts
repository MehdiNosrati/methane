export const reactionBarMessages = {
  barLabel: 'Message reactions',
  addReaction: 'Add reaction',
  reactionLabel: '{emoji} ({count})',
} as const satisfies Record<string, string>;

export type ReactionBarMessages = typeof reactionBarMessages;
