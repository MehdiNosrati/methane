import { defineComponents } from '@methane-ui/core';
import { MthChatThread } from './chat-thread.js';

export { MthChatThread, type ChatMessage } from './chat-thread.js';
export { chatThreadMessages, type ChatThreadMessages } from './chat-thread.messages.js';
export { chatThreadSpec } from './chat-thread.spec.js';
export { chatThreadStyles } from './chat-thread.styles.js';

export function registerMthChatThread(prefix?: string): ReadonlyArray<string> {
  return defineComponents({
    ...(prefix !== undefined ? { prefix } : {}),
    components: { 'mth-chat-thread': MthChatThread },
  });
}
