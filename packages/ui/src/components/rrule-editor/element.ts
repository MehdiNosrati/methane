import { defineComponents } from '@methane/core';
import { MthRruleEditor } from './rrule-editor.js';

export { MthRruleEditor, type RRuleEndMode, type RRuleFrequency, type RRuleWeekday } from './rrule-editor.js';
export { rruleEditorMessages } from './rrule-editor.messages.js';
export { rruleEditorSpec } from './rrule-editor.spec.js';
export { rruleEditorStyles } from './rrule-editor.styles.js';

export function registerMthRruleEditor(prefix?: string): ReadonlyArray<string> {
  return defineComponents({
    ...(prefix !== undefined ? { prefix } : {}),
    components: { 'mth-rrule-editor': MthRruleEditor },
  });
}
