import { registerMthPasskeyPrompt } from './element.js';

export * from './element.js';

registerMthPasskeyPrompt();

declare global {
  interface HTMLElementTagNameMap {
    'mth-passkey-prompt': import('./passkey-prompt.js').MthPasskeyPrompt;
  }
}
