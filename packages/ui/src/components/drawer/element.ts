import { defineComponents } from '@methane-ui/core';
import { MthDrawer } from './drawer.js';

export { MthDrawer, type MthDrawerPlacement, type MthDrawerSize } from './drawer.js';
export { drawerMessages } from './drawer.messages.js';
export { drawerStyles } from './drawer.styles.js';

export function registerMthDrawer(prefix?: string): ReadonlyArray<string> {
  return defineComponents({
    ...(prefix !== undefined ? { prefix } : {}),
    components: { 'mth-drawer': MthDrawer },
  });
}
