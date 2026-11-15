import { defineComponents } from '@methane/core';
import { MthListItem } from './list-item.js';

export { MthListItem } from './list-item.js';
export { listItemMessages } from './list-item.messages.js';
export { listItemSpec } from './list-item.spec.js';
export { listItemStyles } from './list-item.styles.js';

export function registerMthListItem(prefix?: string): ReadonlyArray<string> {
  return defineComponents({
    ...(prefix !== undefined ? { prefix } : {}),
    components: { 'mth-list-item': MthListItem },
  });
}
