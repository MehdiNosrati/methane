import { defineComponents } from '@methane/core';
import { MthNavbar } from './navbar.js';

export { MthNavbar } from './navbar.js';
export { navbarMessages } from './navbar.messages.js';
export { navbarSpec } from './navbar.spec.js';
export { navbarStyles } from './navbar.styles.js';

export function registerMthNavbar(prefix?: string): ReadonlyArray<string> {
  return defineComponents({
    ...(prefix !== undefined ? { prefix } : {}),
    components: { 'mth-navbar': MthNavbar },
  });
}
