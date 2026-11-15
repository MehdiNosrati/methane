import { registerMthMfaChallenge } from './element.js';

export * from './element.js';

registerMthMfaChallenge();

declare global {
  interface HTMLElementTagNameMap {
    'mth-mfa-challenge': import('./mfa-challenge.js').MthMfaChallenge;
  }
}
