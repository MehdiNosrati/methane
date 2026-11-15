import { defineComponents } from '@methane/core';
import { MthMegaMenu } from './mega-menu.js';

export {
  MthMegaMenu,
  type MegaMenuColumn,
  type MegaMenuLink,
  type MegaMenuSection,
} from './mega-menu.js';
export { megaMenuMessages } from './mega-menu.messages.js';
export { megaMenuSpec, CEM_METADATA } from './mega-menu.spec.js';
export { megaMenuStyles } from './mega-menu.styles.js';

export function registerMthMegaMenu(prefix?: string): ReadonlyArray<string> {
  return defineComponents({
    ...(prefix !== undefined ? { prefix } : {}),
    components: { 'mth-mega-menu': MthMegaMenu },
  });
}
