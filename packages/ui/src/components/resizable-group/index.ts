import { registerMthResizableGroup } from './element.js';

export * from './element.js';

registerMthResizableGroup();

declare global {
  interface HTMLElementTagNameMap {
    'mth-resizable-group': import('./resizable-group.js').MthResizableGroup;
  }
}
