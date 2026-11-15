import { defineComponents } from '@methane-ui/core';
import { MthTreeNav } from './tree-nav.js';

export { MthTreeNav, type TreeNavItem } from './tree-nav.js';
export { treeNavMessages } from './tree-nav.messages.js';
export { treeNavSpec } from './tree-nav.spec.js';
export { treeNavStyles } from './tree-nav.styles.js';

export function registerMthTreeNav(prefix?: string): ReadonlyArray<string> {
  return defineComponents({
    ...(prefix !== undefined ? { prefix } : {}),
    components: { 'mth-tree-nav': MthTreeNav },
  });
}
