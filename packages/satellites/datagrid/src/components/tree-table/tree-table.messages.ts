import type { MessageCatalog } from '@methane-ui/core';

export const treeTableMessages = {
  gridLabel: 'Hierarchical tree grid',
  emptyLabel: 'No hierarchical rows to display.',
  expandRowLabel: 'Expand {name}',
  collapseRowLabel: 'Collapse {name}',
  selectRowLabel: 'Select row {id}',
} as const satisfies MessageCatalog;
