import { defineComponents } from '@methane-ui/core';
import { MthMfaChallenge } from './mfa-challenge.js';

export { MthMfaChallenge, type MthMfaMode } from './mfa-challenge.js';
export { mfaChallengeMessages } from './mfa-challenge.messages.js';
export { mfaChallengeSpec } from './mfa-challenge.spec.js';
export { mfaChallengeStyles } from './mfa-challenge.styles.js';

export function registerMthMfaChallenge(prefix?: string): ReadonlyArray<string> {
  return defineComponents({
    ...(prefix !== undefined ? { prefix } : {}),
    components: { 'mth-mfa-challenge': MthMfaChallenge },
  });
}
