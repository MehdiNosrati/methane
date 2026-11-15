import { defineComponents } from '@methane/core';
import { MthRadio } from './radio.js';

export { MthRadio } from './radio.js';
export { radioMessages } from './radio.messages.js';
export { radioSpec } from './radio.spec.js';
export { radioStyles } from './radio.styles.js';

export function registerMthRadio(prefix?: string): ReadonlyArray<string> {
  return defineComponents({
    ...(prefix !== undefined ? { prefix } : {}),
    components: { 'mth-radio': MthRadio },
  });
}
