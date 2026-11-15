export const typingIndicatorMessages = {
  singleTyping: '{first} is typing…',
  pairTyping: '{first} and {second} are typing…',
  groupTyping: {
    one: '{first} and {count} other are typing…',
    other: '{first} and {count} others are typing…',
  },
  idleLabel: 'No one is typing',
} as const;

export type TypingIndicatorMessages = typeof typingIndicatorMessages;
