import { registerMthList } from './element.js';

export * from './element.js';

registerMthList();

declare global {
  interface HTMLElementTagNameMap {
    'mth-list': import('./list.js').MthList;
  }
}
