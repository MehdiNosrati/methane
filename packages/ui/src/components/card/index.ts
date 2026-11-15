import { registerMthCard } from './element.js';

export * from './element.js';

registerMthCard();

declare global {
  interface HTMLElementTagNameMap {
    'mth-card': import('./card.js').MthCard;
  }
}
