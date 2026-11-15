import { defineComponents } from '@methane-ui/core';
import { MthResizableHandle } from './resizable-handle.js';

export {
  MthResizableHandle,
  type MthResizableOrientation,
  type MthResizeDeltaDetail,
} from './resizable-handle.js';
export { resizableHandleMessages } from './resizable-handle.messages.js';
export { resizableHandleSpec } from './resizable-handle.spec.js';
export { resizableHandleStyles } from './resizable-handle.styles.js';

export function registerMthResizableHandle(prefix?: string): ReadonlyArray<string> {
  return defineComponents({
    ...(prefix !== undefined ? { prefix } : {}),
    components: { 'mth-resizable-handle': MthResizableHandle },
  });
}
