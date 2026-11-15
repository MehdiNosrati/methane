import { defineComponents } from '@methane-ui/core';
import { MthResizableGroup } from './resizable-group.js';

export {
  MthResizableGroup,
  type MthResizableGroupOrientation,
} from './resizable-group.js';
export { resizableGroupMessages } from './resizable-group.messages.js';
export { resizableGroupSpec } from './resizable-group.spec.js';
export { resizableGroupStyles } from './resizable-group.styles.js';

export function registerMthResizableGroup(prefix?: string): ReadonlyArray<string> {
  return defineComponents({
    ...(prefix !== undefined ? { prefix } : {}),
    components: { 'mth-resizable-group': MthResizableGroup },
  });
}
