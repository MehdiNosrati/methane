import { registerMthSpreadsheet } from './element.js';
import type { MthSpreadsheet } from './spreadsheet.js';

export * from './element.js';

registerMthSpreadsheet();

declare global {
  interface HTMLElementTagNameMap {
    'mth-spreadsheet': MthSpreadsheet;
  }
}
