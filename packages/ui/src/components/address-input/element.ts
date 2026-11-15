import { defineComponents } from '@methane-ui/core';
import { MthAddressInput } from './address-input.js';

export { MthAddressInput, type AddressValue } from './address-input.js';
export { addressInputMessages } from './address-input.messages.js';
export { addressInputStyles } from './address-input.styles.js';

export function registerMthAddressInput(prefix?: string): ReadonlyArray<string> {
  return defineComponents({
    ...(prefix !== undefined ? { prefix } : {}),
    components: { 'mth-address-input': MthAddressInput },
  });
}
