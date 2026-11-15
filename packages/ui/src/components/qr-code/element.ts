import { defineComponents } from '@methane-ui/core';
import { MthQrCode } from './qr-code.js';

export { encodeQrMatrix, MthQrCode, type QrErrorCorrection } from './qr-code.js';
export { qrCodeMessages, type QrCodeMessages } from './qr-code.messages.js';
export { qrCodeStyles } from './qr-code.styles.js';

export function registerMthQrCode(prefix?: string): ReadonlyArray<string> {
  return defineComponents({
    ...(prefix !== undefined ? { prefix } : {}),
    components: { 'mth-qr-code': MthQrCode },
  });
}
