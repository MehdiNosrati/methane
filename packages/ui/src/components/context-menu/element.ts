import { defineComponents } from '@methane-ui/core';
import { MthContextMenu } from './context-menu.js';

export { MthContextMenu, type ContextMenuItem } from './context-menu.js';
export { contextMenuMessages } from './context-menu.messages.js';
export { contextMenuStyles } from './context-menu.styles.js';

export function registerMthContextMenu(prefix?: string): ReadonlyArray<string> {
  return defineComponents({
    ...(prefix !== undefined ? { prefix } : {}),
    components: { 'mth-context-menu': MthContextMenu },
  });
}
