import { defineComponents } from '@methane/core';
import { MthDialog } from './dialog.js';

export { MthDialog, type MthDialogVariant } from './dialog.js';
export { dialogMessages } from './dialog.messages.js';
export { dialogSpec } from './dialog.spec.js';
export { dialogStyles } from './dialog.styles.js';

export function registerMthDialog(prefix?: string): ReadonlyArray<string> {
  return defineComponents({
    ...(prefix !== undefined ? { prefix } : {}),
    components: { 'mth-dialog': MthDialog },
  });
}
