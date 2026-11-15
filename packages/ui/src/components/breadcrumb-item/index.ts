import { registerMthBreadcrumbItem } from './element.js';

export * from './element.js';

registerMthBreadcrumbItem();

declare global {
  interface HTMLElementTagNameMap {
    'mth-breadcrumb-item': import('./breadcrumb-item.js').MthBreadcrumbItem;
  }
}
