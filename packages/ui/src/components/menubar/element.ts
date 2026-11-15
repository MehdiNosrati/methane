import { defineComponents } from '@methane-ui/core';
import { MthMenubar } from './menubar.js';

export { MthMenubar, type MenubarItem, type MenubarSubItem } from './menubar.js';
export { menubarMessages } from './menubar.messages.js';
export { menubarSpec } from './menubar.spec.js';
export { menubarStyles } from './menubar.styles.js';

export function registerMthMenubar(prefix?: string): ReadonlyArray<string> {
  return defineComponents({
    ...(prefix !== undefined ? { prefix } : {}),
    components: { 'mth-menubar': MthMenubar },
  });
}
