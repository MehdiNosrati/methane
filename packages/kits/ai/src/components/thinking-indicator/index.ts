import { registerMthThinkingIndicator } from './element.js';

export * from './element.js';

registerMthThinkingIndicator();

declare global {
  interface HTMLElementTagNameMap {
    'mth-thinking-indicator': import('./thinking-indicator.js').MthThinkingIndicator;
  }
}
