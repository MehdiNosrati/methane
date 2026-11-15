import { defineComponents } from '@methane/core';
import { MthMentionInput } from './mention-input.js';

export {
  MthMentionInput,
  type MentionChangeDetail,
  type MentionOption,
  type MentionSelectDetail,
} from './mention-input.js';
export { mentionInputMessages, type MentionInputMessages } from './mention-input.messages.js';
export { mentionInputSpec } from './mention-input.spec.js';
export { mentionInputStyles } from './mention-input.styles.js';

export function registerMthMentionInput(prefix?: string): ReadonlyArray<string> {
  return defineComponents({
    ...(prefix !== undefined ? { prefix } : {}),
    components: { 'mth-mention-input': MthMentionInput },
  });
}
