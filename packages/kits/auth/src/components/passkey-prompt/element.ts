import { defineComponents } from '@methane-ui/core';
import { registerMthBadge } from '@methane-ui/ui/badge/element.js';
import { registerMthIcon } from '@methane-ui/ui/icon/element.js';
import { registerMthSpinner } from '@methane-ui/ui/spinner/element.js';
import { MthPasskeyPrompt } from './passkey-prompt.js';

export {
  MthPasskeyPrompt,
  type MthPasskeyMode,
  type MthPasskeyStatus,
} from './passkey-prompt.js';
export { passkeyPromptMessages } from './passkey-prompt.messages.js';
export { passkeyPromptStyles } from './passkey-prompt.styles.js';

export function registerMthPasskeyPrompt(prefix?: string): ReadonlyArray<string> {
  registerMthBadge();
  registerMthIcon();
  registerMthSpinner();
  return defineComponents({
    ...(prefix !== undefined ? { prefix } : {}),
    components: { 'mth-passkey-prompt': MthPasskeyPrompt },
  });
}
