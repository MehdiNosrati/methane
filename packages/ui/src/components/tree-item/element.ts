import { defineComponents } from '@methane/core';
import { MthTreeItem } from './tree-item.js';

export { MthTreeItem } from './tree-item.js';
export { treeItemMessages } from './tree-item.messages.js';
export { treeItemSpec } from './tree-item.spec.js';
export { treeItemStyles } from './tree-item.styles.js';

export function registerMthTreeItem(prefix?: string): ReadonlyArray<string> {
  return defineComponents({
    ...(prefix !== undefined ? { prefix } : {}),
    components: { 'mth-tree-item': MthTreeItem },
  });
}
