import { registerMthPromptInput } from './element.js';

export * from './element.js';

registerMthPromptInput();

declare global {
  interface HTMLElementTagNameMap {
    'mth-prompt-input': import('./prompt-input.js').MthPromptInput;
  }
}
