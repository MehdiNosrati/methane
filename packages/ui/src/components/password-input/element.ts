import { defineComponents } from '@methane-ui/core';
import { MthPasswordInput } from './password-input.js';

export { MthPasswordInput, evaluatePasswordStrength, type PasswordStrengthScore } from './password-input.js';
export { passwordInputMessages } from './password-input.messages.js';
export { passwordInputSpec } from './password-input.spec.js';
export { passwordInputStyles } from './password-input.styles.js';

export function registerMthPasswordInput(prefix?: string): ReadonlyArray<string> {
  return defineComponents({
    ...(prefix !== undefined ? { prefix } : {}),
    components: { 'mth-password-input': MthPasswordInput },
  });
}
