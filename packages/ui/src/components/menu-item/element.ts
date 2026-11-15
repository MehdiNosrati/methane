import { defineComponents } from '@methane/core';
import { MthMenuItem } from './menu-item.js';

export {
  MthMenuItem,
  type MthMenuItemRoleOverride,
  type MthMenuItemType,
} from './menu-item.js';
export { menuItemMessages } from './menu-item.messages.js';
export { menuItemSpec } from './menu-item.spec.js';
export { menuItemStyles } from './menu-item.styles.js';

export function registerMthMenuItem(prefix?: string): ReadonlyArray<string> {
  return defineComponents({
    ...(prefix !== undefined ? { prefix } : {}),
    components: { 'mth-menu-item': MthMenuItem },
  });
}
