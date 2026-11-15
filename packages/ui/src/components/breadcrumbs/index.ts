import { registerMthBreadcrumbs } from './element.js';

export * from './element.js';

registerMthBreadcrumbs();

declare global {
  interface HTMLElementTagNameMap {
    'mth-breadcrumbs': import('./breadcrumbs.js').MthBreadcrumbs;
  }
}
