export const networkStatusMessages = {
  onlineLabel: 'Back online',
  offlineLabel: 'You are offline. Changes may not be saved until connection returns.',
  retryLabel: 'Retry connection',
} as const satisfies Record<string, string>;
