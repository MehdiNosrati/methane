import { defineComponents } from '@methane-ui/core';
import { MthTree } from './tree.js';

export { MthTree, type MthTreeSelectionMode, type TreeNodeData } from './tree.js';
export { treeMessages } from './tree.messages.js';
export { treeStyles } from './tree.styles.js';

export function registerMthTree(prefix?: string): ReadonlyArray<string> {
  return defineComponents({
    ...(prefix !== undefined ? { prefix } : {}),
    components: { 'mth-tree': MthTree },
  });
}
