export const notificationCenterMessages = {
  heading: 'Notifications',
  clearAllLabel: 'Clear all',
  dismissLabel: 'Dismiss notification',
  closeLabel: 'Close notifications',
  emptyMessage: 'You are all caught up.',
  unreadLabel: '{count} notifications',
} as const satisfies Record<string, string>;
