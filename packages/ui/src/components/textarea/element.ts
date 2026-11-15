import { defineComponents } from '@methane-ui/core';
import { MthTextarea } from './textarea.js';

export { MthTextarea, type MthTextareaResize } from './textarea.js';
export { textareaMessages } from './textarea.messages.js';
export { textareaStyles } from './textarea.styles.js';

export function registerMthTextarea(prefix?: string): ReadonlyArray<string> {
  return defineComponents({
    ...(prefix !== undefined ? { prefix } : {}),
    components: { 'mth-textarea': MthTextarea },
  });
}
