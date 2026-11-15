import { registerMthSiteSearch } from './element.js';

export * from './element.js';

registerMthSiteSearch();

declare global {
  interface HTMLElementTagNameMap {
    'mth-site-search': import('./site-search.js').MthSiteSearch;
  }
}
