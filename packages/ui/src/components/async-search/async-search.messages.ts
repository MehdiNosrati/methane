export const asyncSearchMessages = {
  placeholder: 'Search...',
  loading: 'Loading results...',
  emptyResults: 'No results found',
  errorMessage: 'Failed to load results',
  clearLabel: 'Clear selection',
  valueMissing: 'Please search and select an option.',
  defaultLabel: 'Async search',
} as const satisfies Record<string, string>;

export type AsyncSearchMessages = typeof asyncSearchMessages;
