import { registerMthSkeleton } from './element.js';

export * from './element.js';

registerMthSkeleton();

declare global {
  interface HTMLElementTagNameMap {
    'mth-skeleton': import('./skeleton.js').MthSkeleton;
  }
}
