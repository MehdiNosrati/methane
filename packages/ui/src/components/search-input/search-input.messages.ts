export const searchInputMessages = {
  requiredIndicator: '*',
  defaultLabel: 'Search',
  clearSearch: 'Clear search',
  searchShortcutHint: 'Press {shortcut} to focus',
  valueMissing: 'Please enter a search term.',
} as const satisfies Record<string, string>;
