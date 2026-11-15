import { defineComponents } from '@methane-ui/core';
import { MthCodeEditor } from './code-editor.js';

export { MthCodeEditor, type CodeEditorEngine } from './code-editor.js';
export { codeEditorMessages } from './code-editor.messages.js';
export { codeEditorStyles } from './code-editor.styles.js';

export function registerMthCodeEditor(prefix?: string): ReadonlyArray<string> {
  return defineComponents({
    ...(prefix !== undefined ? { prefix } : {}),
    components: { 'mth-code-editor': MthCodeEditor },
  });
}
