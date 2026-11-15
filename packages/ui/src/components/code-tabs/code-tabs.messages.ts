export const codeTabsMessages = {
  tablistLabel: 'Code examples',
  copyLabel: 'Copy code',
  copiedLabel: 'Copied',
  emptyLabel: 'No code examples available.',
  copiedAnnouncement: 'Copied code to clipboard.',
  copyFailedAnnouncement: 'Unable to copy code.',
} as const;

export type CodeTabsMessages = typeof codeTabsMessages;
