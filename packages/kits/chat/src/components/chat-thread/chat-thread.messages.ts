export const chatThreadMessages = {
  threadLabel: 'Conversation messages',
  emptyLabel: 'No messages yet.',
  loadingLabel: 'Loading messages…',
  errorLabel: 'Failed to load messages.',
  retryLabel: 'Retry',
  unreadDividerLabel: 'New messages',
  scrollToBottomLabel: 'Scroll to latest messages',
} as const satisfies Record<string, string>;

export type ChatThreadMessages = typeof chatThreadMessages;
