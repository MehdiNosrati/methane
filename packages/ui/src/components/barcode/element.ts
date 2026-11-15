import { defineComponents } from '@methane-ui/core';
import { MthBarcode } from './barcode.js';

export { encodeCode128B, MthBarcode, type BarcodeBar } from './barcode.js';
export { barcodeMessages, type BarcodeMessages } from './barcode.messages.js';
export { barcodeStyles } from './barcode.styles.js';

export function registerMthBarcode(prefix?: string): ReadonlyArray<string> {
  return defineComponents({
    ...(prefix !== undefined ? { prefix } : {}),
    components: { 'mth-barcode': MthBarcode },
  });
}
