import { defineComponents } from '@methane/core';
import { MthIbanInput } from './iban-input.js';

export { MthIbanInput } from './iban-input.js';
export { ibanInputMessages } from './iban-input.messages.js';
export { ibanInputSpec, CEM_METADATA } from './iban-input.spec.js';
export { ibanInputStyles } from './iban-input.styles.js';

export function registerMthIbanInput(prefix?: string): ReadonlyArray<string> {
  return defineComponents({
    ...(prefix !== undefined ? { prefix } : {}),
    components: { 'mth-iban-input': MthIbanInput },
  });
}
