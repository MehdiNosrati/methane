import { defineComponents } from '@methane-ui/core';
import { MthBreadcrumbPath } from './breadcrumb-path.js';

export {
  MthBreadcrumbPath,
  type MthBreadcrumbPathItem,
} from './breadcrumb-path.js';
export { breadcrumbPathMessages } from './breadcrumb-path.messages.js';
export { breadcrumbPathStyles } from './breadcrumb-path.styles.js';

export function registerMthBreadcrumbPath(prefix?: string): ReadonlyArray<string> {
  return defineComponents({
    ...(prefix !== undefined ? { prefix } : {}),
    components: { 'mth-breadcrumb-path': MthBreadcrumbPath },
  });
}
