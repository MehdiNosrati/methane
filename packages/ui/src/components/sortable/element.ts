import { defineComponents } from '@methane-ui/core';
import { MthSortable } from './sortable.js';

export {
  MthSortable,
  type MthSortableItem,
  type MthSortableOrientation,
} from './sortable.js';
export { sortableMessages } from './sortable.messages.js';
export { sortableStyles } from './sortable.styles.js';

export function registerMthSortable(prefix?: string): ReadonlyArray<string> {
  return defineComponents({
    ...(prefix !== undefined ? { prefix } : {}),
    components: { 'mth-sortable': MthSortable },
  });
}
