import { defineComponents } from '@methane-ui/core';
import { MthFab } from './fab.js';

export {
  MthFab,
  type MthFabPlacement,
  type MthFabSize,
  type MthFabVariant,
} from './fab.js';
export { fabMessages } from './fab.messages.js';
export { fabStyles } from './fab.styles.js';

export function registerMthFab(prefix?: string): ReadonlyArray<string> {
  return defineComponents({
    ...(prefix !== undefined ? { prefix } : {}),
    components: { 'mth-fab': MthFab },
  });
}
