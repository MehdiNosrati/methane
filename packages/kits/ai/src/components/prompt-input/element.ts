import { defineComponents } from '@methane/core';
import { registerMthButton } from '@methane/ui/button/element.js';
import { MthPromptInput } from './prompt-input.js';

export { MthPromptInput } from './prompt-input.js';
export { promptInputMessages } from './prompt-input.messages.js';
export { promptInputSpec } from './prompt-input.spec.js';
export { promptInputStyles } from './prompt-input.styles.js';

export function registerMthPromptInput(prefix?: string): ReadonlyArray<string> {
  registerMthButton();
  return defineComponents({
    ...(prefix !== undefined ? { prefix } : {}),
    components: { 'mth-prompt-input': MthPromptInput },
  });
}
