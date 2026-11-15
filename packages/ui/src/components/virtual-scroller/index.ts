import { registerMthVirtualScroller } from './element.js';

export * from './element.js';

registerMthVirtualScroller();

declare global {
  interface HTMLElementTagNameMap {
    'mth-virtual-scroller': import('./virtual-scroller.js').MthVirtualScroller;
  }
}
