import { registerMthBreadcrumbPath } from './element.js';

export * from './element.js';

registerMthBreadcrumbPath();

declare global {
  interface HTMLElementTagNameMap {
    'mth-breadcrumb-path': import('./breadcrumb-path.js').MthBreadcrumbPath;
  }
}
