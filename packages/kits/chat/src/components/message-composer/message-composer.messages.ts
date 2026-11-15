export const messageComposerMessages = {
  label: 'Message composer',
  placeholder: 'Write a message…',
  sendLabel: 'Send message',
  stopLabel: 'Stop generating',
  attachLabel: 'Attach file',
  emojiLabel: 'Insert emoji',
  requiredError: 'Please enter a message.',
} as const satisfies Record<string, string>;

export type MessageComposerMessages = typeof messageComposerMessages;
