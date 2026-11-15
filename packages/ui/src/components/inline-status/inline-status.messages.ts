export const inlineStatusMessages = {
  loadingLabel: 'Loading',
  successLabel: 'Saved',
  warningLabel: 'Warning',
  dangerLabel: 'Error',
  infoLabel: 'Info',
  neutralLabel: 'Ready',
} as const satisfies Record<string, string>;
