export const emojiPickerMessages = {
  triggerLabel: 'Choose emoji',
  searchPlaceholder: 'Search emojis...',
  searchLabel: 'Search emojis',
  skinToneLabel: 'Skin tone',
  allCategory: 'All',
  recentCategory: 'Recent',
  categoriesLabel: 'Emoji categories',
  gridLabel: 'Emojis',
  emptyText: 'No matching emojis',
  pickerLabel: 'Emoji picker',
} as const satisfies Record<string, string>;

export type EmojiPickerMessages = typeof emojiPickerMessages;
