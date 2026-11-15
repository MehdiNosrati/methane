import { defineComponents } from '@methane-ui/core';
import { MthPopover } from './popover.js';

export { MthPopover } from './popover.js';
export { popoverMessages } from './popover.messages.js';
export { popoverSpec } from './popover.spec.js';
export { popoverStyles } from './popover.styles.js';

export function registerMthPopover(prefix?: string): ReadonlyArray<string> {
  return defineComponents({
    ...(prefix !== undefined ? { prefix } : {}),
    components: { 'mth-popover': MthPopover },
  });
}
