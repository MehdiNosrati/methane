import { defineComponents } from '@methane/core';
import { MthRichEditor } from './rich-editor.js';

export { MthRichEditor, type RichEditorEngine } from './rich-editor.js';
export { richEditorMessages } from './rich-editor.messages.js';
export { richEditorSpec } from './rich-editor.spec.js';
export { richEditorStyles } from './rich-editor.styles.js';

export function registerMthRichEditor(prefix?: string): ReadonlyArray<string> {
  return defineComponents({
    ...(prefix !== undefined ? { prefix } : {}),
    components: { 'mth-rich-editor': MthRichEditor },
  });
}
