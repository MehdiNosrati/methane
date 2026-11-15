import { registerMthBottomSheet } from './element.js';
import type { MthBottomSheet } from './bottom-sheet.js';

registerMthBottomSheet();

export * from './element.js';

declare global {
  interface HTMLElementTagNameMap {
    'mth-bottom-sheet': MthBottomSheet;
  }
}
