import { registerMthPopover } from './element.js';

export * from './element.js';

registerMthPopover();

declare global {
  interface HTMLElementTagNameMap {
    'mth-popover': import('./popover.js').MthPopover;
  }
}
