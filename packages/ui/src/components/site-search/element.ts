import { defineComponents } from '@methane/core';
import { MthSiteSearch } from './site-search.js';

export { MthSiteSearch, type SiteSearchItem } from './site-search.js';
export { siteSearchMessages } from './site-search.messages.js';
export { siteSearchSpec, CEM_METADATA } from './site-search.spec.js';
export { siteSearchStyles } from './site-search.styles.js';

export function registerMthSiteSearch(prefix?: string): ReadonlyArray<string> {
  return defineComponents({
    ...(prefix !== undefined ? { prefix } : {}),
    components: { 'mth-site-search': MthSiteSearch },
  });
}
