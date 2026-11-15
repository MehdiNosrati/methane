export const tagInputMessages = {
  placeholder: 'Add tag...',
  removeTag: 'Remove tag',
  valueMissing: 'Please add at least one tag.',
  defaultLabel: 'Tags',
} as const satisfies Record<string, string>;

export type TagInputMessages = typeof tagInputMessages;
