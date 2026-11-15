import { defineComponents } from '@methane/core';
import { MthBreadcrumbItem } from './breadcrumb-item.js';

export { MthBreadcrumbItem } from './breadcrumb-item.js';
export { breadcrumbItemMessages } from './breadcrumb-item.messages.js';
export { breadcrumbItemSpec } from './breadcrumb-item.spec.js';
export { breadcrumbItemStyles } from './breadcrumb-item.styles.js';

export function registerMthBreadcrumbItem(prefix?: string): ReadonlyArray<string> {
  return defineComponents({
    ...(prefix !== undefined ? { prefix } : {}),
    components: { 'mth-breadcrumb-item': MthBreadcrumbItem },
  });
}
