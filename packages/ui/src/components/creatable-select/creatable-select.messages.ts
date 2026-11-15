export const creatableSelectMessages = {
  placeholder: 'Select or type to create...',
  createPrefix: 'Create',
  clearLabel: 'Clear selection',
  removeTag: 'Remove',
  emptyResults: 'No options available',
  valueMissing: 'Please select or create an option.',
  defaultLabel: 'Creatable select',
} as const satisfies Record<string, string>;

export type CreatableSelectMessages = typeof creatableSelectMessages;
