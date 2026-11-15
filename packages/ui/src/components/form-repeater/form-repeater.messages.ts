export const formRepeaterMessages = {
  requiredIndicator: '*',
  defaultLabel: 'Items',
  addRow: 'Add item',
  removeRow: 'Remove item {index}',
  moveUp: 'Move item {index} up',
  moveDown: 'Move item {index} down',
  dragHandle: 'Reorder item {index}',
  defaultFieldLabel: 'Value',
  minRowsViolation: 'At least {min} item(s) are required.',
} as const satisfies Record<string, string>;
