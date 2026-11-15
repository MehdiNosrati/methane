import { defineComponents } from '@methane-ui/core';
import { MthSwitch } from './switch.js';

export { MthSwitch } from './switch.js';
export { switchMessages } from './switch.messages.js';
export { switchSpec } from './switch.spec.js';
export { switchStyles } from './switch.styles.js';

export function registerMthSwitch(prefix?: string): ReadonlyArray<string> {
  return defineComponents({
    ...(prefix !== undefined ? { prefix } : {}),
    components: { 'mth-switch': MthSwitch },
  });
}
