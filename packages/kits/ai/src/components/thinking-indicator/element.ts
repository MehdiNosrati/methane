import { defineComponents } from '@methane-ui/core';
import { registerMthIcon } from '@methane-ui/ui/icon/element.js';
import { registerMthSpinner } from '@methane-ui/ui/spinner/element.js';
import { MthThinkingIndicator } from './thinking-indicator.js';

export { MthThinkingIndicator } from './thinking-indicator.js';
export { thinkingIndicatorMessages } from './thinking-indicator.messages.js';
export { thinkingIndicatorStyles } from './thinking-indicator.styles.js';

export function registerMthThinkingIndicator(prefix?: string): ReadonlyArray<string> {
  registerMthIcon();
  registerMthSpinner();
  return defineComponents({
    ...(prefix !== undefined ? { prefix } : {}),
    components: { 'mth-thinking-indicator': MthThinkingIndicator },
  });
}
