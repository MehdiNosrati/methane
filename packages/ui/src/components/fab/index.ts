import { registerMthFab } from './element.js';

export * from './element.js';

registerMthFab();

declare global {
  interface HTMLElementTagNameMap {
    'mth-fab': import('./fab.js').MthFab;
  }
}
