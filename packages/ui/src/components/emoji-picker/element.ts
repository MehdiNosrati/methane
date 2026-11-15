import { defineComponents } from '@methane/core';
import { MthEmojiPicker } from './emoji-picker.js';

export {
  DEFAULT_EMOJIS,
  MthEmojiPicker,
  type EmojiEntry,
  type EmojiSelectDetail,
} from './emoji-picker.js';
export { emojiPickerMessages, type EmojiPickerMessages } from './emoji-picker.messages.js';
export { emojiPickerSpec } from './emoji-picker.spec.js';
export { emojiPickerStyles } from './emoji-picker.styles.js';

export function registerMthEmojiPicker(prefix?: string): ReadonlyArray<string> {
  return defineComponents({
    ...(prefix !== undefined ? { prefix } : {}),
    components: { 'mth-emoji-picker': MthEmojiPicker },
  });
}
