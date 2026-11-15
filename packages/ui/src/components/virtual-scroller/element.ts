import { defineComponents } from '@methane-ui/core';
import { MthVirtualScroller } from './virtual-scroller.js';

export { MthVirtualScroller } from './virtual-scroller.js';
export { virtualScrollerMessages } from './virtual-scroller.messages.js';
export { virtualScrollerStyles } from './virtual-scroller.styles.js';

export function registerMthVirtualScroller(prefix?: string): ReadonlyArray<string> {
  return defineComponents({
    ...(prefix !== undefined ? { prefix } : {}),
    components: { 'mth-virtual-scroller': MthVirtualScroller },
  });
}
