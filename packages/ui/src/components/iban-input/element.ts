import { defineComponents } from '@methane-ui/core';
import { MthIbanInput } from './iban-input.js';

export { MthIbanInput } from './iban-input.js';
export { ibanInputMessages } from './iban-input.messages.js';
export { ibanInputStyles } from './iban-input.styles.js';

export function registerMthIbanInput(prefix?: string): ReadonlyArray<string> {
  return defineComponents({
    ...(prefix !== undefined ? { prefix } : {}),
    components: { 'mth-iban-input': MthIbanInput },
  });
}
