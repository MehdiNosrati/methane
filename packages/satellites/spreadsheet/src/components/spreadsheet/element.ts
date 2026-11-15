import { defineComponents } from '@methane-ui/core';
import { MthSpreadsheet } from './spreadsheet.js';

export {
  MthSpreadsheet,
  type AddressMode,
  type MthSpreadsheetEngine,
} from './spreadsheet.js';
export { spreadsheetMessages } from './spreadsheet.messages.js';
export { spreadsheetStyles } from './spreadsheet.styles.js';

export function registerMthSpreadsheet(prefix?: string): ReadonlyArray<string> {
  return defineComponents({
    ...(prefix !== undefined ? { prefix } : {}),
    components: { 'mth-spreadsheet': MthSpreadsheet },
  });
}
