import { defineComponents } from '@methane/core';
import { MthMarkdownEditor } from './markdown-editor.js';

export { MthMarkdownEditor, type MarkdownEditorEngine } from './markdown-editor.js';
export { markdownEditorMessages } from './markdown-editor.messages.js';
export { markdownEditorSpec, type MarkdownEditorMode } from './markdown-editor.spec.js';
export { markdownEditorStyles } from './markdown-editor.styles.js';

export function registerMthMarkdownEditor(prefix?: string): ReadonlyArray<string> {
  return defineComponents({
    ...(prefix !== undefined ? { prefix } : {}),
    components: { 'mth-markdown-editor': MthMarkdownEditor },
  });
}
