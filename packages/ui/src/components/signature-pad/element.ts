import { defineComponents } from '@methane/core';
import { MthSignaturePad } from './signature-pad.js';

export function registerMthSignaturePad(prefix?: string): ReadonlyArray<string> {
  return defineComponents({
    ...(prefix !== undefined ? { prefix } : {}),
    components: { 'mth-signature-pad': MthSignaturePad },
  });
}

export { MthSignaturePad, type SignaturePoint } from './signature-pad.js';
export { signaturePadMessages } from './signature-pad.messages.js';
export { signaturePadSpec } from './signature-pad.spec.js';
export { signaturePadStyles } from './signature-pad.styles.js';
