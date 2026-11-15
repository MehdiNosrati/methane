import { registerMthResizableHandle } from './element.js';

export * from './element.js';

registerMthResizableHandle();

declare global {
  interface HTMLElementTagNameMap {
    'mth-resizable-handle': import('./resizable-handle.js').MthResizableHandle;
  }
}
