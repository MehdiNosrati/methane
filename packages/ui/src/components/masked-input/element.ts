import { defineComponents } from '@methane-ui/core';
import { MthMaskedInput } from './masked-input.js';

export { MthMaskedInput } from './masked-input.js';
export { maskedInputMessages } from './masked-input.messages.js';
export { maskedInputStyles } from './masked-input.styles.js';

export function registerMthMaskedInput(prefix?: string): ReadonlyArray<string> {
  return defineComponents({
    ...(prefix !== undefined ? { prefix } : {}),
    components: { 'mth-masked-input': MthMaskedInput },
  });
}
