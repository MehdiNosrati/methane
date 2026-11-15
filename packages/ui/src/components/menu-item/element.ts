import { defineComponents } from '@methane-ui/core';
import { MthMenuItem } from './menu-item.js';

export {
  MthMenuItem,
  type MthMenuItemRoleOverride,
  type MthMenuItemType,
} from './menu-item.js';
export { menuItemMessages } from './menu-item.messages.js';
export { menuItemStyles } from './menu-item.styles.js';

export function registerMthMenuItem(prefix?: string): ReadonlyArray<string> {
  return defineComponents({
    ...(prefix !== undefined ? { prefix } : {}),
    components: { 'mth-menu-item': MthMenuItem },
  });
}
