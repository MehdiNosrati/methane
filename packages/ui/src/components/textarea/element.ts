import { defineComponents } from '@methane/core';
import { MthTextarea } from './textarea.js';

export { MthTextarea, type MthTextareaResize } from './textarea.js';
export { textareaMessages } from './textarea.messages.js';
export { textareaSpec } from './textarea.spec.js';
export { textareaStyles } from './textarea.styles.js';

export function registerMthTextarea(prefix?: string): ReadonlyArray<string> {
  return defineComponents({
    ...(prefix !== undefined ? { prefix } : {}),
    components: { 'mth-textarea': MthTextarea },
  });
}
