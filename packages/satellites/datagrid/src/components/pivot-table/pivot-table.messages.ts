import type { MessageCatalog } from '@methane/core';

export const pivotTableMessages = {
  gridLabel: 'Pivot table',
  rowGroupHeader: 'Group',
  totalsRowLabel: 'Totals',
  emptyLabel: 'No pivot rows to display.',
  toggleGroupLabel: 'Toggle group {group}',
} as const satisfies MessageCatalog;
