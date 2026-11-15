import { registerMthChatThread } from './element.js';

export * from './element.js';

registerMthChatThread();

declare global {
  interface HTMLElementTagNameMap {
    'mth-chat-thread': import('./chat-thread.js').MthChatThread;
  }
}
