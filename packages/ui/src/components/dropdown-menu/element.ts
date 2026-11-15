import { defineComponents } from '@methane/core';
import { MthDropdownMenu } from './dropdown-menu.js';

export { MthDropdownMenu, type MthDropdownMenuRoleMode } from './dropdown-menu.js';
export { dropdownMenuMessages } from './dropdown-menu.messages.js';
export { dropdownMenuSpec } from './dropdown-menu.spec.js';
export { dropdownMenuStyles } from './dropdown-menu.styles.js';

export function registerMthDropdownMenu(prefix?: string): ReadonlyArray<string> {
  return defineComponents({
    ...(prefix !== undefined ? { prefix } : {}),
    components: { 'mth-dropdown-menu': MthDropdownMenu },
  });
}
