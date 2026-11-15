import { registerMthOtpInput } from './element.js';

export * from './element.js';

registerMthOtpInput();

declare global {
  interface HTMLElementTagNameMap {
    'mth-otp-input': import('./otp-input.js').MthOtpInput;
  }
}
