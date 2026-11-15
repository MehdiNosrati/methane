import { defineComponents } from '@methane/core';
import { MthBottomNav } from './bottom-nav.js';

export { MthBottomNav, type BottomNavItem } from './bottom-nav.js';
export { bottomNavMessages } from './bottom-nav.messages.js';
export { bottomNavSpec } from './bottom-nav.spec.js';
export { bottomNavStyles } from './bottom-nav.styles.js';

export function registerMthBottomNav(prefix?: string): ReadonlyArray<string> {
  return defineComponents({
    ...(prefix !== undefined ? { prefix } : {}),
    components: { 'mth-bottom-nav': MthBottomNav },
  });
}
