import { defineComponents } from '@methane/core';
import { MthSidebarNav } from './sidebar-nav.js';

export { MthSidebarNav, type SidebarNavItem } from './sidebar-nav.js';
export { sidebarNavMessages } from './sidebar-nav.messages.js';
export { sidebarNavSpec } from './sidebar-nav.spec.js';
export { sidebarNavStyles } from './sidebar-nav.styles.js';

export function registerMthSidebarNav(prefix?: string): ReadonlyArray<string> {
  return defineComponents({
    ...(prefix !== undefined ? { prefix } : {}),
    components: { 'mth-sidebar-nav': MthSidebarNav },
  });
}
