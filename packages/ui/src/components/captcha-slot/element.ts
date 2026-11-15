import { defineComponents } from '@methane-ui/core';
import { MthCaptchaSlot } from './captcha-slot.js';

export { MthCaptchaSlot } from './captcha-slot.js';
export { captchaSlotMessages } from './captcha-slot.messages.js';
export { captchaSlotSpec } from './captcha-slot.spec.js';
export { captchaSlotStyles } from './captcha-slot.styles.js';

export function registerMthCaptchaSlot(prefix?: string): ReadonlyArray<string> {
  return defineComponents({
    ...(prefix !== undefined ? { prefix } : {}),
    components: { 'mth-captcha-slot': MthCaptchaSlot },
  });
}
