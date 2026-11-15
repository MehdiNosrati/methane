export const toggleGroupMessages = {
  groupLabel: 'Toggle options',
  valueMissing: 'Please select at least one option.',
} as const satisfies Record<string, string>;

export type ToggleGroupMessages = typeof toggleGroupMessages;
