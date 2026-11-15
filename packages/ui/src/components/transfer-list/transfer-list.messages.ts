export const transferListMessages = {
  sourceTitle: 'Available',
  targetTitle: 'Selected',
  searchPlaceholder: 'Filter items...',
  selectAllLabel: 'Select all',
  moveRightLabel: 'Move selected to target',
  moveLeftLabel: 'Move selected to source',
  moveAllRightLabel: 'Move all to target',
  moveAllLeftLabel: 'Move all to source',
  emptyText: 'No items',
  requiredError: 'Please select at least one item',
} as const satisfies Record<string, string>;

export type TransferListMessages = typeof transferListMessages;
