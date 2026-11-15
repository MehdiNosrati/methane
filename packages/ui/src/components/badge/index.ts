import { registerMthBadge } from './element.js';

export * from './element.js';

registerMthBadge();

declare global {
  interface HTMLElementTagNameMap {
    'mth-badge': import('./badge.js').MthBadge;
  }
}
