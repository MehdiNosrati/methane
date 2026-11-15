import { defineComponents } from '@methane/core';
import { MthOtpInput } from './otp-input.js';

export { MthOtpInput } from './otp-input.js';
export { otpInputMessages } from './otp-input.messages.js';
export { otpInputSpec } from './otp-input.spec.js';
export { otpInputStyles } from './otp-input.styles.js';

export function registerMthOtpInput(prefix?: string): ReadonlyArray<string> {
  return defineComponents({
    ...(prefix !== undefined ? { prefix } : {}),
    components: { 'mth-otp-input': MthOtpInput },
  });
}
