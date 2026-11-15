import { registerMthAiMessage } from './element.js';

export * from './element.js';

registerMthAiMessage();

declare global {
  interface HTMLElementTagNameMap {
    'mth-ai-message': import('./ai-message.js').MthAiMessage;
  }
}
