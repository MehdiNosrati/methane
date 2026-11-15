import type { MessageCatalog } from '@methane/core';

export const pivotTableMessages = {
  gridLabel: 'Pivot table',
  rowGroupHeader: 'Group',
  totalsRowLabel: 'Totals',
  allGroupLabel: 'All',
  totalColumnLabel: 'Total',
  emptyLabel: 'No pivot rows to display.',
  toggleGroupLabel: 'Toggle group {group}',
} as const satisfies MessageCatalog;
