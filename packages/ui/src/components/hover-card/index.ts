import { registerMthHoverCard } from './element.js';

export * from './element.js';

registerMthHoverCard();

declare global {
  interface HTMLElementTagNameMap {
    'mth-hover-card': import('./hover-card.js').MthHoverCard;
  }
}
