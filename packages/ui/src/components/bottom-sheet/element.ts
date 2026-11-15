import { defineComponents } from '@methane/core';
import { MthBottomSheet } from './bottom-sheet.js';

export { MthBottomSheet, type BottomSheetDetent } from './bottom-sheet.js';
export { bottomSheetMessages } from './bottom-sheet.messages.js';
export { bottomSheetSpec } from './bottom-sheet.spec.js';
export { bottomSheetStyles } from './bottom-sheet.styles.js';

export function registerMthBottomSheet(prefix?: string): ReadonlyArray<string> {
  return defineComponents({
    ...(prefix !== undefined ? { prefix } : {}),
    components: {
      'mth-bottom-sheet': MthBottomSheet,
    },
  });
}
