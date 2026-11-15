import { defineComponents } from '@methane-ui/core';
import { MthTypingIndicator } from './typing-indicator.js';

export { MthTypingIndicator } from './typing-indicator.js';
export { typingIndicatorMessages, type TypingIndicatorMessages } from './typing-indicator.messages.js';
export { typingIndicatorSpec } from './typing-indicator.spec.js';
export { typingIndicatorStyles } from './typing-indicator.styles.js';

export function registerMthTypingIndicator(prefix?: string): ReadonlyArray<string> {
  return defineComponents({
    ...(prefix !== undefined ? { prefix } : {}),
    components: { 'mth-typing-indicator': MthTypingIndicator },
  });
}
