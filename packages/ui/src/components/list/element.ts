import { defineComponents } from '@methane/core';
import { MthList } from './list.js';

export { MthList, type ListItemData, type MthListSelectionMode } from './list.js';
export { listMessages } from './list.messages.js';
export { listSpec } from './list.spec.js';
export { listStyles } from './list.styles.js';

export function registerMthList(prefix?: string): ReadonlyArray<string> {
  return defineComponents({
    ...(prefix !== undefined ? { prefix } : {}),
    components: { 'mth-list': MthList },
  });
}
