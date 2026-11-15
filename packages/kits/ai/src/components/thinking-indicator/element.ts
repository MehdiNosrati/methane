import { defineComponents } from '@methane/core';
import { registerMthIcon } from '@methane/ui/icon/element.js';
import { registerMthSpinner } from '@methane/ui/spinner/element.js';
import { MthThinkingIndicator } from './thinking-indicator.js';

export { MthThinkingIndicator } from './thinking-indicator.js';
export { thinkingIndicatorMessages } from './thinking-indicator.messages.js';
export { thinkingIndicatorSpec } from './thinking-indicator.spec.js';
export { thinkingIndicatorStyles } from './thinking-indicator.styles.js';

export function registerMthThinkingIndicator(prefix?: string): ReadonlyArray<string> {
  registerMthIcon();
  registerMthSpinner();
  return defineComponents({
    ...(prefix !== undefined ? { prefix } : {}),
    components: { 'mth-thinking-indicator': MthThinkingIndicator },
  });
}
