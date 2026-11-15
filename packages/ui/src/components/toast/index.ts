import { registerMthToast } from './element.js';

export * from './element.js';

registerMthToast();

declare global {
  interface HTMLElementTagNameMap {
    'mth-toast': import('./toast.js').MthToast;
  }
}
