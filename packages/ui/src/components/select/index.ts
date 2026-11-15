import { registerMthSelect } from './element.js';

export * from './element.js';

registerMthSelect();

declare global {
  interface HTMLElementTagNameMap {
    'mth-select': import('./select.js').MthSelect;
  }
}
