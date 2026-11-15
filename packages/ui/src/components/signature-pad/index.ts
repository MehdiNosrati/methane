import { registerMthSignaturePad } from './element.js';

export * from './element.js';

registerMthSignaturePad();

declare global {
  interface HTMLElementTagNameMap {
    'mth-signature-pad': import('./signature-pad.js').MthSignaturePad;
  }
}
