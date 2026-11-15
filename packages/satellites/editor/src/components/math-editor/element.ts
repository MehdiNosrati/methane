import { defineComponents } from '@methane/core';
import { MthMathEditor } from './math-editor.js';

export { MthMathEditor, type MathEditorEngine } from './math-editor.js';
export { mathEditorMessages } from './math-editor.messages.js';
export { mathEditorSpec } from './math-editor.spec.js';
export { mathEditorStyles } from './math-editor.styles.js';

export function registerMthMathEditor(prefix?: string): ReadonlyArray<string> {
  return defineComponents({
    ...(prefix !== undefined ? { prefix } : {}),
    components: { 'mth-math-editor': MthMathEditor },
  });
}
