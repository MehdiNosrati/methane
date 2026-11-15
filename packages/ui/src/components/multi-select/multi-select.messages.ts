export const multiSelectMessages = {
  placeholder: 'Select options...',
  searchPlaceholder: 'Filter options...',
  clearAll: 'Clear all selections',
  removeTag: 'Remove',
  emptyResults: 'No matching options',
  valueMissing: 'Please select at least one option.',
  defaultLabel: 'Multi select',
} as const satisfies Record<string, string>;

export type MultiSelectMessages = typeof multiSelectMessages;
