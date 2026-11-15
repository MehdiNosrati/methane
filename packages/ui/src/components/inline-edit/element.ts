import { defineComponents } from '@methane-ui/core';
import { MthInlineEdit } from './inline-edit.js';

export { MthInlineEdit } from './inline-edit.js';
export { inlineEditMessages } from './inline-edit.messages.js';
export { inlineEditStyles } from './inline-edit.styles.js';

export function registerMthInlineEdit(prefix?: string): ReadonlyArray<string> {
  return defineComponents({
    ...(prefix !== undefined ? { prefix } : {}),
    components: { 'mth-inline-edit': MthInlineEdit },
  });
}
