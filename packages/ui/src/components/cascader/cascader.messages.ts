export const cascaderMessages = {
  placeholder: 'Select an option...',
  clearLabel: 'Clear selection',
  noOptions: 'No options available',
  requiredError: 'Please select an option',
  levelLabel: 'Cascader level',
} as const satisfies Record<string, string>;

export type CascaderMessages = typeof cascaderMessages;
