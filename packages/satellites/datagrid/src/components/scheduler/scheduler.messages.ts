import type { MessageCatalog } from '@methane/core';

export const schedulerMessages = {
  gridLabel: 'Resource timeline scheduler',
  resourceColumnLabel: 'Resource',
  emptyLabel: 'No scheduled resources to display.',
  selectEventLabel: 'Event {title}',
} as const satisfies MessageCatalog;
