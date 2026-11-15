import type { MessageCatalog } from '@methane/core';

export const formulaBarMessages = {
  toolbarLabel: 'Formula bar',
  addressBoxLabel: 'Active cell address',
  formulaInputLabel: 'Formula or cell value',
  formulaPlaceholder: 'Enter value or =SUM(A1:B4)',
  commitButtonLabel: 'Apply formula',
  invalidFormulaError: 'Invalid formula syntax.',
  valueMissingError: 'Formula or cell value is required.',
} as const satisfies MessageCatalog;
