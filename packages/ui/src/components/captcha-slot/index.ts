import { registerMthCaptchaSlot } from './element.js';

export * from './element.js';

registerMthCaptchaSlot();

declare global {
  interface HTMLElementTagNameMap {
    'mth-captcha-slot': import('./captcha-slot.js').MthCaptchaSlot;
  }
}
