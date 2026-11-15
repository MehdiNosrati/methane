import { registerMthStatCard } from './element.js';

export * from './element.js';

registerMthStatCard();

declare global {
  interface HTMLElementTagNameMap {
    'mth-stat-card': import('./stat-card.js').MthStatCard;
  }
}
