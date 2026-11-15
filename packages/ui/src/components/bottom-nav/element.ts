import { defineComponents } from '@methane-ui/core';
import { MthBottomNav } from './bottom-nav.js';

export { MthBottomNav, type BottomNavItem } from './bottom-nav.js';
export { bottomNavMessages } from './bottom-nav.messages.js';
export { bottomNavStyles } from './bottom-nav.styles.js';

export function registerMthBottomNav(prefix?: string): ReadonlyArray<string> {
  return defineComponents({
    ...(prefix !== undefined ? { prefix } : {}),
    components: { 'mth-bottom-nav': MthBottomNav },
  });
}
