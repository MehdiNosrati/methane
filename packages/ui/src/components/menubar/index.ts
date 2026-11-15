import { registerMthMenubar } from './element.js';

export * from './element.js';

registerMthMenubar();

declare global {
  interface HTMLElementTagNameMap {
    'mth-menubar': import('./menubar.js').MthMenubar;
  }
}
