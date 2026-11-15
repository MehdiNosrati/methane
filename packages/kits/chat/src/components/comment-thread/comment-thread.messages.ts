export const commentThreadMessages = {
  threadLabel: 'Comment thread',
  emptyLabel: 'No comments yet.',
  replyLabel: 'Reply',
  submitReplyLabel: 'Post reply',
  cancelLabel: 'Cancel',
  replyPlaceholder: 'Write a reply…',
  resolveLabel: 'Resolve',
  reopenLabel: 'Reopen',
  resolvedBadge: 'Resolved',
  showReplies: 'Show replies ({count})',
  hideReplies: 'Hide replies ({count})',
} as const satisfies Record<string, string>;

export type CommentThreadMessages = typeof commentThreadMessages;
