export const mentionInputMessages = {
  placeholder: 'Type @ to mention someone...',
  noResults: 'No matching mentions',
  suggestionsLabel: 'Mention suggestions',
  requiredError: 'Please enter a value',
} as const satisfies Record<string, string>;

export type MentionInputMessages = typeof mentionInputMessages;
