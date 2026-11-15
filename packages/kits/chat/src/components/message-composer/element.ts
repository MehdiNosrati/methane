import { defineComponents } from '@methane-ui/core';
import { MthMessageComposer } from './message-composer.js';

export { MthMessageComposer } from './message-composer.js';
export {
  messageComposerMessages,
  type MessageComposerMessages,
} from './message-composer.messages.js';
export { messageComposerSpec } from './message-composer.spec.js';
export { messageComposerStyles } from './message-composer.styles.js';

export function registerMthMessageComposer(prefix?: string): ReadonlyArray<string> {
  return defineComponents({
    ...(prefix !== undefined ? { prefix } : {}),
    components: { 'mth-message-composer': MthMessageComposer },
  });
}
