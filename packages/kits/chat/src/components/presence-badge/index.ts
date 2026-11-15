import { registerMthPresenceBadge } from './element.js';

export * from './element.js';

registerMthPresenceBadge();

declare global {
  interface HTMLElementTagNameMap {
    'mth-presence-badge': import('./presence-badge.js').MthPresenceBadge;
  }
}
