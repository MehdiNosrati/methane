import { defineComponents } from '@methane-ui/core';
import { MthPhoneInput } from './phone-input.js';

export { MthPhoneInput, PHONE_COUNTRIES, type PhoneCountryOption } from './phone-input.js';
export { phoneInputMessages } from './phone-input.messages.js';
export { phoneInputStyles } from './phone-input.styles.js';

export function registerMthPhoneInput(prefix?: string): ReadonlyArray<string> {
  return defineComponents({
    ...(prefix !== undefined ? { prefix } : {}),
    components: { 'mth-phone-input': MthPhoneInput },
  });
}
