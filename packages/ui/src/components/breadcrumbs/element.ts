import { defineComponents } from '@methane-ui/core';
import { MthBreadcrumbs } from './breadcrumbs.js';

export { MthBreadcrumbs } from './breadcrumbs.js';
export { breadcrumbsMessages } from './breadcrumbs.messages.js';
export { breadcrumbsStyles } from './breadcrumbs.styles.js';

export function registerMthBreadcrumbs(prefix?: string): ReadonlyArray<string> {
  return defineComponents({
    ...(prefix !== undefined ? { prefix } : {}),
    components: { 'mth-breadcrumbs': MthBreadcrumbs },
  });
}
