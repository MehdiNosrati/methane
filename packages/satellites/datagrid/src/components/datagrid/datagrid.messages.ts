import type { MessageCatalog } from '@methane-ui/core';

export const datagridMessages = {
  gridLabel: 'Data grid',
  loadingLabel: 'Loading rows…',
  emptyLabel: 'No rows to display.',
  errorLabel: 'Unable to load grid data.',
  retryLabel: 'Retry',
  selectAllLabel: 'Select all rows',
  selectRowLabel: 'Select row {id}',
  resizeColumnLabel: 'Resize {column} column',
} as const satisfies MessageCatalog;
