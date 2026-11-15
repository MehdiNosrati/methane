import { registerMthTypingIndicator } from './element.js';

export * from './element.js';

registerMthTypingIndicator();

declare global {
  interface HTMLElementTagNameMap {
    'mth-typing-indicator': import('./typing-indicator.js').MthTypingIndicator;
  }
}
