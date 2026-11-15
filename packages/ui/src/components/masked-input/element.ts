import { defineComponents } from '@methane/core';
import { MthMaskedInput } from './masked-input.js';

export { MthMaskedInput } from './masked-input.js';
export { maskedInputMessages } from './masked-input.messages.js';
export { maskedInputSpec, CEM_METADATA } from './masked-input.spec.js';
export { maskedInputStyles } from './masked-input.styles.js';

export function registerMthMaskedInput(prefix?: string): ReadonlyArray<string> {
  return defineComponents({
    ...(prefix !== undefined ? { prefix } : {}),
    components: { 'mth-masked-input': MthMaskedInput },
  });
}
