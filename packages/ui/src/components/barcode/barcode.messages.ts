export const barcodeMessages = {
  defaultLabel: 'Code 128 barcode',
  emptyLabel: 'No barcode value',
} as const satisfies Record<string, string>;

export type BarcodeMessages = typeof barcodeMessages;
