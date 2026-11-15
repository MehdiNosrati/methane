import { defineComponents } from '@methane/core';
import { MthCountdown } from './countdown.js';

export { MthCountdown } from './countdown.js';
export { countdownMessages } from './countdown.messages.js';
export { countdownSpec } from './countdown.spec.js';
export { countdownStyles } from './countdown.styles.js';

export function registerMthCountdown(prefix?: string): ReadonlyArray<string> {
  return defineComponents({
    ...(prefix !== undefined ? { prefix } : {}),
    components: { 'mth-countdown': MthCountdown },
  });
}
