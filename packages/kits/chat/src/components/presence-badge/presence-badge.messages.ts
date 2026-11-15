export const presenceBadgeMessages = {
  online: 'Online',
  away: 'Away',
  busy: 'Busy',
  offline: 'Offline',
  statusPrefix: 'Status',
} as const satisfies Record<string, string>;

export type PresenceBadgeMessages = typeof presenceBadgeMessages;
