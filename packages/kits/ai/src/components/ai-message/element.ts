import { defineComponents } from '@methane-ui/core';
import { registerMthAvatar } from '@methane-ui/ui/avatar/element.js';
import { registerMthBadge } from '@methane-ui/ui/badge/element.js';
import { registerMthButton } from '@methane-ui/ui/button/element.js';
import { registerMthIcon } from '@methane-ui/ui/icon/element.js';
import { MthAiMessage } from './ai-message.js';

export { MthAiMessage, type MthAiMessageRole } from './ai-message.js';
export { aiMessageMessages } from './ai-message.messages.js';
export { aiMessageStyles } from './ai-message.styles.js';

export function registerMthAiMessage(prefix?: string): ReadonlyArray<string> {
  registerMthAvatar();
  registerMthBadge();
  registerMthButton();
  registerMthIcon();
  return defineComponents({
    ...(prefix !== undefined ? { prefix } : {}),
    components: { 'mth-ai-message': MthAiMessage },
  });
}
