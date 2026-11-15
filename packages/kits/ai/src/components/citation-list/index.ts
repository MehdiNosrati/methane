import { registerMthCitationList } from './element.js';

export * from './element.js';

registerMthCitationList();

declare global {
  interface HTMLElementTagNameMap {
    'mth-citation-list': import('./citation-list.js').MthCitationList;
  }
}
