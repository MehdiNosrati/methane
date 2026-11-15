import { registerMthIcon } from './element.js';

export * from './element.js';

registerMthIcon();

declare global {
  interface HTMLElementTagNameMap {
    'mth-icon': import('./icon.js').MthIcon;
  }
}
