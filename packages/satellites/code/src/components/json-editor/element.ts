import { defineComponents } from '@methane/core';
import { MthJsonEditor } from './json-editor.js';

export { MthJsonEditor, type JsonEditorEngine } from './json-editor.js';
export { jsonEditorMessages } from './json-editor.messages.js';
export { jsonEditorSpec, type JsonEditorMode } from './json-editor.spec.js';
export { jsonEditorStyles } from './json-editor.styles.js';

export function registerMthJsonEditor(prefix?: string): ReadonlyArray<string> {
  return defineComponents({
    ...(prefix !== undefined ? { prefix } : {}),
    components: { 'mth-json-editor': MthJsonEditor },
  });
}
