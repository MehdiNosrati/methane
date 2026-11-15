import type { MessageCatalog } from '@methane-ui/core';

export const spreadsheetMessages = {
  gridLabel: 'Spreadsheet worksheet',
  cornerHeaderLabel: 'Row and column selector',
  cellEditorLabel: 'Edit cell {address}',
  rowHeaderLabel: 'Row {row}',
  columnHeaderLabel: 'Column {column}',
  fallbackLabel: 'Spreadsheet fallback view.',
} as const satisfies MessageCatalog;
